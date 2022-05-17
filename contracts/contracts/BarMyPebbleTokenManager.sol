pragma solidity >=0.5.8;
// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
import "./Ownable.sol";
import "./Initializable.sol";
import "./hedera/HederaTokenService.sol";

/// @title BarMyPebbleTokenManager
/// @author brianspha
/// @notice This contract manages all tokens to be issued to any data related to a pebble device
/// @dev To think about this
contract BarMyPebbleTokenManager is HederaTokenService, Ownable, Initializable {
    /*==========================================================events definition start==========================================================*/
    event tranferToken(
        address indexed sender,
        address indexed receiver,
        int64 indexed tokenId
    );
    /*==========================================================Modifiers definition start==========================================================*/

    /// @notice This ensures that any funciton marked with this modifier is callable by the BarMyPebbleContract
    /// @dev Explain to a developer any extra details
    modifier onlyBarMyPebble() {
        require(
            msg.sender == barMyPebbleContractAddress,
            "Only BarMyPebble contract can make this call"
        );
        _;
    }
    /*==========================================================Variable definition start==========================================================*/
    address public barMyPebbleContractAddress; //@dev the contract responsible for allowing people to borrow out their pebble data
    address public tokenAddress; //@dev the NFT deployed on hedera
    int64[] public tokenIds;
    mapping(int64 => address) internal tokens;
    uint64 public totalSupply;

    /*==========================================================Functions definition start==========================================================*/
    constructor () public {
        
    }
    function setBarMyPebbleContractAddress(
        address _barMyPebbleAddress,
        address _tokenAddress
    ) public onlyOwner {
        require(
            _barMyPebbleAddress != address(0) || _tokenAddress != address(0),
            "invalid barMyPebble or token address"
        );
        barMyPebbleContractAddress = _barMyPebbleAddress;
        tokenAddress = _tokenAddress;
    }

    /// @notice This functions mints a new token
    /// @dev All tokens must have metadata which describes the data associated with the pebble device
    /// @param tokenOwner To whom the token is to be minted for
    /// @param tokenURI The metadata associated with the token
    /// @return (int64[],uint64)
    function mintToken(address tokenOwner, bytes memory tokenURI)
        public
        onlyBarMyPebble
        returns (int64)
    {
        bytes[] memory tempTokenURI = new bytes[](1);//@dev not so elegant
        tempTokenURI[0] = tokenURI;
        (
            int256 response,
            uint64 newTotalSupply,
            int64[] memory serialNumbers
        ) = HederaTokenService.mintToken(tokenAddress, 1, tempTokenURI);

        if (response != HederaResponseCodes.SUCCESS) {
            revert("Mint Failed");
        }
        int256 transferResponse = HederaTokenService.transferNFT(
            tokenAddress,
            owner(),
            tokenOwner,
            serialNumbers[0]
        );
        if (transferResponse != HederaResponseCodes.SUCCESS) {
            revert("Transfer Failed");
        }
        tokenIds = serialNumbers;
        totalSupply = newTotalSupply;
        tokens[serialNumbers[0]] = tokenOwner;
        return serialNumbers[0];
    }


    function transfer(
        address sender,
        address receiver,
        int64 tokenId
    ) public {
        int256 transferResponse = HederaTokenService.transferNFT(
            tokenAddress,
            sender,
            receiver,
            tokenId
        );
        if (transferResponse != HederaResponseCodes.SUCCESS) {
            revert("Transfer Failed");
        }
        emit tranferToken(sender, receiver, tokenId);
    }


    function tokenExists(int64 tokenId) public view returns (bool) {
        return tokens[tokenId] != address(0);
    }

    function ownerOf(int64 tokenId) public view returns (address) {
        address owner = tokens[tokenId];
        require(owner != address(0), "owner query for nonexistent token");
        return owner;
    }
    function mintedTokens() public view returns (int64[] memory){
        return tokenIds;
    }
}
