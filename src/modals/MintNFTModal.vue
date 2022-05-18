<template>
  <v-row justify="center">
    <v-dialog v-model="$store.state.mintNFTDialog" width="100vw">
      <v-card>
        <v-card-title
          style="font-size: 25px; font-style: italic; font-family: cursive"
        >
          NFT Details
        </v-card-title>
        <v-card-text
          ><v-form ref="form" v-model="valid" lazy-validation>
            <v-row style="padding-bottom: 40px"
              ><vue-css-doodle
                ref="doodle"
                :key="$store.state.selectedNFT.colorPallet"
              >
                {{ $store.state.selectedNFT.doodleStyle }}
              </vue-css-doodle></v-row
            >
            <v-text-field
              v-model="$store.state.selectedNFT.name"
              label="NFT Name"
              :rules="nameRules"
              :color="$store.state.primaryColor"
            ></v-text-field>
            <v-text-field
              type="number"
              :rules="priceRules"
              v-model="$store.state.selectedNFT.price"
              label="NFT Price (hBAR)"
              :color="$store.state.primaryColor"
            ></v-text-field>
            <v-text-field
              v-model="$store.state.userAddressHedera"
              label="Current Owner"
              readonly
              :color="$store.state.primaryColor"
            ></v-text-field>
            <v-text-field
              v-model="$store.state.selectedNFT.latitude"
              label="Latitude"
              readonly
              :color="$store.state.primaryColor"
            ></v-text-field>
            <v-text-field
              v-model="$store.state.selectedNFT.longitude"
              label="Latitude"
              readonly
              :color="$store.state.primaryColor"
            ></v-text-field>
            <v-text-field
              v-model="$store.state.selectedNFT.twitter_username"
              :rules="usernameRules"
              label="Twitter Username"
              hint="e.g. brianspha_"
              required
              :color="$store.state.primaryColor"
            ></v-text-field> </v-form
        ></v-card-text>
        <v-row align="center" justify="center"
          ><v-btn
            style="
              background-color: #6bdcc6;
              color: white;
              border-radius: 5px;
              font-style: italic;
              border-color: #699c79;
              border-width: 1px;
              font-family: cursive;
              font-weight: bold;
              color: white;
            "
            @click="save"
            >Save AS PNG</v-btn
          ></v-row
        >
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text
            @click="
              $store.state.mintNFTDialog = false;
              $store.state.selectedNFT = {};
            "
          >
            Close
          </v-btn>
          <v-btn
            v-if="valid"
            style="
              background-color: #6bdcc6;
              color: white;
              border-radius: 5px;
              font-style: italic;
              border-color: #699c79;
              border-width: 1px;
              font-family: cursive;
              font-weight: bold;
              color: black;
            "
            @click="mintNFT"
          >
            MINT NFT
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
import bigNumber from "bignumber.js";

export default {
  data() {
    return {
      showToolTip: false,
      delegate: false,
      nftName: "",
      nameRules: [
        (v) => !!v || "NFT name required",
        (v) =>
          (v && v.length >= 4 && v.length <= 100) ||
          "NFT name must be atleast 4 characters and atmost 100 characters",
      ],
      nftPrice: 0,
      twitterUserName: "",
      usernameRules: [
        (v) => !!v || "Username required",
        (v) =>
          (v && v.length >= 4 && v.length <= 15) ||
          "Twitter username must be atleast 4 characters or less than equal to 15 characters",
      ],
      valid: false,
      offerPrice: 0,
      priceRules: [
        (v) => !!v || "Offer Price is required",
        (v) =>
          (v && !isNaN(v) && parseFloat(v) > 0) ||
          "Offer Price must be a valid amount",
      ],
      tokenMinted: false,
    };
  },
  mounted() {
    this.$store.state.isLoading = false;
    if (!this.$store.state.mintNFTDialog) return;
  },
  created() {
    this.$store.state.isLoading = false;
  },
  watch: {
    "$store.state.mintNFTDialog": function (val) {
      if (val) {
        this.generateArt();
      }
    },
  },
  methods: {
    generateArt() {
      console.log("in mint nft dialog: ", this.$store.state.selectedNFT);
      let _this = this;
      var colorPallet = [
        _this.generateColor(Date.now()),
        _this.generateColor(_this.$store.state.selectedNFT.timestamp),
        _this.generateColor(_this.$store.state.selectedNFT.snr),
        _this.generateColor(_this.$store.state.selectedNFT.vbat),
        _this.generateColor(_this.$store.state.selectedNFT.latitude),
        _this.generateColor(_this.$store.state.selectedNFT.longitude),
        _this.generateColor(_this.$store.state.selectedNFT.gasResistance),
        _this.generateColor(_this.$store.state.selectedNFT.temperature),
        _this.generateColor(_this.$store.state.selectedNFT.pressure),
        _this.generateColor(_this.$store.state.selectedNFT.humidity),
        _this.generateColor(_this.$store.state.selectedNFT.light),
        _this.generateColor(_this.$store.state.selectedNFT.temperature2),
      ];
      _this.$store.state.selectedNFT.colorPallet = colorPallet.join();
      _this.$store.state.selectedNFT.gyroscope.map((gyrData) => {
        colorPallet.push(_this.generateColor(gyrData));
      });
      _this.$store.state.selectedNFT.accelerometer.map((ccelerometerData) => {
        colorPallet.push(_this.generateColor(ccelerometerData));
      });
      _this.$store.state.selectedNFT.doodleStyle = `:doodle { @grid: 40 / 100vmax; } background: @p(${colorPallet.join()}); :after { content: ''; @size: 100%; position: absolute;
                background: @m(4, radial-gradient( circle at @p(-40% -40%, 140%
                140%, 140% -40%, -40% 140%), @p(${colorPallet.join()}) 50%, transparent 50% )), radial-gradient(
                @p(${colorPallet.join()}) @r(-10%, 40%),
                transparent 0 ) }`;
      _this.$store.state.isLoading = false;
    },
    generateColor(seed) {
      return `#${Math.floor(
        Math.abs(Math.sin(seed) * 16777215) % 16777215
      ).toString(16)}`;
    },
    mintNFT: async function () {
      if (this.$refs.form.validate()) {
        let _this = this;
        this.$store.state.isLoading = true;
        this.$store.state.selectedNFT.originalPrice =
          this.$store.state.selectedNFT.price;
        var mintToken = await this.$store.dispatch("mintToken", {
          information: this.$store.state.selectedNFT,
        });
        if (!mintToken.success) {
          console.log("error minting BarMyPebble token: ", mintToken);
          _this.$store.state.isLoading = false;
          _this.$store.dispatch("error", {
            error:
              "Something went wrong while minting BarMyPebbe token, this could be caused by the transaction reverting or the transaction ran out of gas while executing please inspect the website to see console",
          });
        } else {
          _this.$store.state.selectedNFT.isNFT = true;
          _this.$store.state.selectedNFT.tokenId = mintToken.tokenId;
          var content = await _this.$store.dispatch("getTextileData");
          content = content[0];
          _this.$store.state.selectedNFT.isNFT = true;
          _this.$store.state.selectedNFT.isDelegated = _this.delegate;
          if (content.data.length === 0) {
            content.leaderboard = [
              {
                walletEth: _this.$store.state.userAddressEth,
                walletHedera: _this.$store.state.userAddressHedera,
                twitter_username:
                  _this.$store.state.selectedNFT.twitter_username,
                barmypebbles_minted: 1,
                barmypebbles_bought: 0,
              },
            ];
            content.data = [
              {
                userAddressEth: _this.$store.state.userAddressEth,
                userAddressHedera: _this.$store.state.userAddressHedera,
                imeis: [_this.$store.state.selectedNFT.imei],
                data: [
                  {
                    imei: _this.$store.state.selectedNFT.imei,
                    nfts: [_this.$store.state.selectedNFT],
                  },
                ],
              },
            ];
            // content.data.push(_this.$store.state.userData);
          } else {
            var found = false;
            for (var index in content.data) {
              //@dev for some reason for works better than map
              var record = content.data[index];
              if (
                record.userAddressHedera ===
                _this.$store.state.userAddressHedera
              ) {
                found = true;
                record = record.data.map((minted) => {
                  if (minted.imei === _this.$store.state.selectedNFT.imei) {
                    minted.nfts.push(_this.$store.state.selectedNFT);
                  }
                  return minted;
                });
              }
            }
            content.leaderboard.map((user) => {
              if (user.walletHedera === _this.$store.state.userAddressHedera) {
                user.barmypebbles_minted++;
              }
              return user;
            });
            if (!found) {
              content.leaderboard.push({
                walletEth: _this.$store.state.userAddressEth,
                walletHedera: _this.$store.state.userAddressHedera,
                twitter_username:
                  _this.$store.state.selectedNFT.twitter_username,
                barmypebbles_minted: 1,
                barmypebbles_bought: 0,
              });
              content.data.push({
                userAddressEth: _this.$store.state.userAddressEth,
                userAddressHedera: _this.$store.state.userAddressHedera,
                imeis: [_this.$store.state.selectedNFT.imei],
                data: [
                  {
                    imei: _this.$store.state.selectedNFT.imei,
                    nfts: [_this.$store.state.selectedNFT],
                  },
                ],
              });
            }
          }
          console.log("updatedContent: ", content);
          await _this.$store.dispatch("saveTextileData", content);
          // _this.$store.state.mintNFTDialog = false;
          _this.$store.dispatch("success", "Succesfully minted token");
          await _this.$store.dispatch("loadData");
          _this.$store.state.isLoading = false;
          _this.$store.state.reload = true;
          _this.$store.state.selectedNFT = {};
          _this.tokenMinted = true;
        }
      }
    },
    transferToken: async function (tokenId) {
      return new Promise((resolve) => {
        let _this = this;
        this.$store.state.tokenContract.methods
          .transferFrom(
            this.$store.state.userAddressHedera,
            this.$store.state.ionftContract.options.address,
            tokenId
          )
          .send({
            from: this.$store.state.userAddressHedera,
            gas: 5000000,
          })
          .then((receipt, error) => {
            console.log("results of transferring token to contract: ", receipt);
            resolve(receipt && !error);
          })
          .catch((error) => {
            console.log("error while transferring token to contract: ", error);
            resolve(false);
          });
      });
    },
    save: async function () {
      if (!this.tokenMinted) {
        const doodle = document.querySelector("css-doodle");
        console.log("doodle: ", doodle);
        let _this = this;
        this.$store.state.isLoading = true;
        doodle
          .export({
            scale: 6,
            download: true,
          })
          .then((data, error) => {
            _this.$store.state.isLoading = false;
            console.log("data,error: ", data, error);
          })
          .catch((error) => {
            console.log("error: ", error);
            _this.$store.state.isLoading = false;
          });
      }

      /* open Dev tools to see the result */
    },
  },
};
</script>

<style></style>
