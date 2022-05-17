pragma solidity >=0.6.2;
pragma experimental ABIEncoderV2;

import "./BarMyPebbleTokenManager.sol";
import "./Initializable.sol";
import "./SafeMathV2.sol";
import "./Ownable.sol";
import "./ReentrancyGuard.sol";
import "./interfaces/IBarMyPebble.sol";
import "./Pausable.sol";

//"SPDX-License-Identifier: MIT"

/// @title BarMyPebble
/// @author The name of the author
/// @notice Explain to an end user what this does
/// @dev Explain to a developer any extra details

contract BarMyPebble is
    Ownable,
    Initializable,
    IBarMyPebble,
    ReentrancyGuard,
    Pausable
{
    using SafeMathV2 for uint256;

    /*==========================================================Modifier definition start==========================================================*/

    /*==========================================================Event definition start==========================================================*/
    /*==========================================================Variable definition start==========================================================*/
    uint256 public transactionFees = 0;
    uint256 public minMintCost = 0.01 ether;
    uint256 public contractCut = 3500;
    address payable contractOwner;
    BarMyPebbleTokenManager barMyPebbleToken;
    address[] mintersIds;

    mapping(int64 => Pebble) currentPebbles;
    mapping(address => Minter) minters;

    /*==========================================================Function definition start==========================================================*/
    constructor () public {
        
    }
    function setBarMyPebbleTokenAddress(address tokenAddress)
        public
        override
        onlyOwner
        initializer
    {
        require(tokenAddress != address(0), "Invalid token address");
        require(msg.sender != address(0), "Invalid sender address");
        barMyPebbleToken = BarMyPebbleTokenManager(tokenAddress);
        contractOwner = msg.sender; //@dev we could use the owner() function but it returns an address thats not payable
    }

    function withdrawFees() public payable override onlyOwner nonReentrant {
        require(transactionFees > 0, "Nothing to withdraw");
        uint256 fees = transactionFees;
        transactionFees = 0;
        require(contractOwner.send(fees), "Insufficient funds");
        emit adminFeeCollection(block.timestamp, fees);
    }

    function mintToken(
        string memory tokenURI,
        uint256 tokenPrice,
        bool delegate
    ) public override whenNotPaused {
        require(msg.sender != address(0), "Invalid sender");
        require(tokenPrice > 0, "Invalid token price");
        if (!minters[msg.sender].active) {
            minters[msg.sender].id = msg.sender;
            minters[msg.sender].totalStaked = 0;
            minters[msg.sender].active = true;
            mintersIds.push(msg.sender);
        }
        int64 tokenId;
        if (delegate) {
            tokenId = barMyPebbleToken.mintToken(
                address(this),
                bytes(tokenURI)
            );
        } else {
            tokenId = barMyPebbleToken.mintToken(msg.sender, bytes(tokenURI));
        }
        require(barMyPebbleToken.tokenExists(tokenId), "Token not minted");
        currentPebbles[tokenId].delegated = delegate;
        currentPebbles[tokenId].tokenId = tokenId;
        currentPebbles[tokenId].originalPrice = tokenPrice;
        currentPebbles[tokenId].price = tokenPrice;
        currentPebbles[tokenId].exists = true;
        currentPebbles[tokenId].owner = msg.sender;
        emit newTokenMinted(msg.sender, tokenId, currentPebbles[tokenId].price);
    }

    function buyToken(int64 tokenId)
        public
        payable
        override
        nonReentrant
        whenNotPaused
    {
        require(currentPebbles[tokenId].delegated, "Token not delegated");
        require(msg.sender != address(0), "Invalid sender");
        require(
            barMyPebbleToken.tokenExists(tokenId) &&
                currentPebbles[tokenId].exists,
            "Token not minted yet or not active"
        );
        require(
            msg.sender != currentPebbles[tokenId].owner &&
                barMyPebbleToken.ownerOf(tokenId) != msg.sender,
            "Owner not allowed to buy own nft"
        );
        require(
            msg.value > currentPebbles[tokenId].price,
            "Invalid buying price"
        );
        require(currentPebbles[tokenId].delegated, "token not delegated");
        uint256 soldPrice = msg.value;
        uint256 tempPrice = getContractCut(
            msg.value.sub(currentPebbles[tokenId].price)
        );
        transactionFees = transactionFees.add(tempPrice);
        uint256 remaining = msg.value.sub(tempPrice);
        require(
            currentPebbles[tokenId].owner.send(remaining),
            "Insufficient funds"
        );
        currentPebbles[tokenId].price = soldPrice;
        minters[currentPebbles[tokenId].owner].totalStaked = minters[
            currentPebbles[tokenId].owner
        ].totalStaked.add(remaining);
        address previousOwner = currentPebbles[tokenId].owner;
        currentPebbles[tokenId].owner = msg.sender;
        currentPebbles[tokenId].delegated = false;
        barMyPebbleToken.transfer(address(this), msg.sender, tokenId);
        emit transferTokenOwnerShip(
            msg.sender,
            previousOwner,
            msg.value,
            tokenId,
            tempPrice
        );
    }

    function revokeDelegatedNFT(int64 tokenId) public override {
        require(msg.sender != address(0), "Invalid sender address");
        require(
            currentPebbles[tokenId].exists &&
                barMyPebbleToken.tokenExists(tokenId),
            "Token not listed or exists"
        );
        require(
            barMyPebbleToken.ownerOf(tokenId) == address(this),
            "Contract Not Owner"
        );
        require(currentPebbles[tokenId].delegated, "Token not delegated");
        barMyPebbleToken.transfer(address(this), msg.sender, tokenId);
        currentPebbles[tokenId].delegated = false;
        emit revokedDelegatedToken(tokenId);
    }

    function delegateNFT(int64 tokenId) public override {
        require(msg.sender != address(0), "Invalid sender address");
        require(
            currentPebbles[tokenId].exists &&
                barMyPebbleToken.tokenExists(tokenId),
            "Token not listed or exists"
        );
        require(
            barMyPebbleToken.ownerOf(tokenId) == address(this),
            "Contract Not Owner"
        );
        require(!currentPebbles[tokenId].delegated, "Token already delegated");
        currentPebbles[tokenId].delegated = true;
        emit delegatedToken(tokenId);
    }

    function getMinterDetails(address id)
        public
        view
        override
        returns (uint256, bool)
    {
        return (minters[id].totalStaked, minters[id].active);
    }

    function getMinterKeys() public view override returns (address[] memory) {
        return mintersIds;
    }

    function getTokenIndexes() public view override returns (int64[] memory) {
        return barMyPebbleToken.mintedTokens();
    }

    function getTokenDetails(int64 tokenId)
        public
        override
        returns (
            address,
            uint256,
            uint256,
            bool,
            bool
        )
    {
        return (
            currentPebbles[tokenId].owner,
            currentPebbles[tokenId].price,
            currentPebbles[tokenId].originalPrice,
            currentPebbles[tokenId].exists,
            currentPebbles[tokenId].delegated
        );
    }

    function burnToken(int64 tokenId) public whenNotPaused {}

    function getContractCut(uint256 value) internal view returns (uint256) {
        uint256 roundValue = value.ceil(100);
        uint256 cut = roundValue.mul(contractCut).div(10000);
        return cut;
    }
}
