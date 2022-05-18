<template>
  <v-row justify="center">
    <v-dialog v-model="$store.state.showAccountDialog" persistent>
      <v-card>
        <v-card-title>
          Please pair with the HashPack extension using the following string
        </v-card-title>
        <v-card-text>
          {{ $store.state.saveData.pairingString }}
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="$store.state.showAccountDialog = false">
            Close
          </v-btn>
          <v-btn
            :color="$store.state.primaryColor"
            text
            v-clipboard:copy="$store.state.saveData.pairingString"
            v-clipboard:success="copiedText"
            v-clipboard:error="copiedText"
          >
            Copy
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
export default {
  data() {
    return {
      selectedAccounts: [],
    };
  },
  methods: {
    copiedText(event) {
      console.log("copied text: ", event);
      this.$store.state.showAccountDialog = false;
    },
  },
};
</script>

<style></style>
