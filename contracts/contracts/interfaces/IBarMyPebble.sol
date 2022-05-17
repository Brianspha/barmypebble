pragma solidity >=0.5.8;

// SPDX-License-Identifier: MIT

/// @title IBarMyPebble
/// @author brianspha
/// @notice This inteface contains all functions required for the BarMyPebble contract
/// @dev Any contract that inherits this interface will have to implement all functions also WIP
interface IBarMyPebble {
    //************************************Struct Definition ************************************************************ */

    struct Pebble {
        //@dev we can add previous owners array
        int64 tokenId;
        address payable owner;
        bool delegated;
        uint256 price;
        uint256 originalPrice;
        bool exists;
    }
    struct Minter {
        address payable id;
        uint256 totalStaked;
        bool active;
    }
    //************************************Modifier Definition ************************************************************ */

    /// @notice Checks if a given user address owns a given token id
    /// @param user address to check against ownership of a given token id
    modifier ownsToken(address user) virtual {
        _;
    }

    //************************************Event Definition ************************************************************ */
    /// @notice Event is emmited whwenever a new token is minted
    event newTokenMinted(
        address indexed owner,
        int64 indexed tokenId,
        uint256 indexed tokenPrice
    );
    /// @notice Event is emmited whwenever a new token changes ownership
    event transferTokenOwnerShip(
        address indexed owner,
        address indexed previousOwner,
        uint256 cost,
        int64 tokenIndex,
        uint256 contractCut
    );
    /// @notice Event is emmited whwenever a new token is purchased
    event adminFeeCollection(uint256 indexed date, uint256 indexed amount);
    /// @notice Event is emmited whwenever a token is delegated to be listed on the contract

    event delegatedToken(int64 indexed tokenId);
    /// @notice Event is emmited whwenever a token is delegated to be delisted on the contract
    event revokedDelegatedToken(int64 indexed tokenId);

    //************************************Function Definition ************************************************************ */
    /**
    @notice called when a user mints a token from pebble data
    @param tokenPrice- The price the token is to be sold for
    @param tokenURI - the json data associated with the current pixel
    @dev function doesnt return a value just emits a value using the **pixelColored** event
  */
    function mintToken(
        string calldata tokenURI,
        uint256 tokenPrice,
        bool delegate
    ) external;

    /// @notice Fetches all  registered minter keys from the smart contract storage
    /// @return minter addresses
    function getMinterKeys() external view returns (address[] memory);

    /// @dev Fetches all token indexes registered on the smartcontract storage
    /// @return token indexes
    function getTokenIndexes() external view returns (int64[] memory);

    /// @notice Gets token info based on the given tokenId
    /// @param tokenId the id of the token
    /// @return the token details
    function getTokenDetails(int64 tokenId)
        external
        returns (
            address,
            uint256,
            uint256,
            bool,
            bool
        );

    /// @notice returns an minter details
    /// @param user the id of the token
    /// @return returns an minter details
    function getMinterDetails(address user)
        external
        view
        returns (uint256, bool);

    /// @notice allows a user to purchase a token
    /// @param tokenId The token index
    function buyToken(int64 tokenId) external payable;

    /// @notice allows the admin to withdraw the tx fees
    function withdrawFees() external payable;

    /// @notice Delegates a token to the smartcontract for others to purchase
    /// @dev Before a user is able to purchase a token the owner of the the token must delegate it to the smartcontract
    /// @param tokenId the id of the token
    function delegateNFT(int64 tokenId) external;

    /// @notice allows the user to revoke delagation of token from the contract
    /// @dev The owner of the token must be the one to call this function and must have deletgated the token prior
    /// @param tokenId the id of the token
    function revokeDelegatedNFT(int64 tokenId) external;
    /// @notice allows and admin to set the BarMyPebbleTokenManager address
    /// @dev Only the contract deployer or current owner can call this function
    /// @param tokenAddress The address of the TokenManager contract
    function setBarMyPebbleTokenAddress(address tokenAddress) external;
   
}
