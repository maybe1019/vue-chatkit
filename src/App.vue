<template>
  <v-app :theme="theme">
    <v-app-bar title="Chat App">
      <v-spacer></v-spacer>
      <v-btn v-if="loggedIn" class="d-flex py-1 align-center">
        <v-avatar v-if="loggedIn" :image="myAccount.avatar"></v-avatar>
        {{ myAccount.name }}

        <v-menu activator="parent">
          <v-list>
            <v-list-item value="10">
              <v-list-item-title @click="logOut">Log out</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-btn>

      <v-btn @click="changeTheme">
        <v-icon
          v-bind:icon="
            theme === 'light' ? 'mdi-weather-sunny' : 'mdi-weather-night'
          "
        ></v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-if="loggedIn" floating permanent>
      <v-list density="compact" nav>
        <v-list-item
          v-for="group in groups"
          :key="group.guid"
          :value="group.guid"
          @click="onGroupSelected(group)"
        >
          <v-avatar :image="group.icon"></v-avatar>
          {{ group.name }}
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main v-if="loggedIn">
      <div v-for="msg in groupMessages" :key="msg.sentAt" class="px-3 py-1">
        <div v-if="msg.category === 'message'" class="d-flex">
          <v-avatar :image="msg.sender.avatar"></v-avatar>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>{{ msg.sender.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ msg.data.text }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </div>
        <div v-if="msg.category === 'action' && msg.action === 'added'" class="d-flex subtitle-2 px-5 text-blue">
          <v-icon icon="mdi-arrow-right-bold"></v-icon> 
          {{ msg.actionOn.name }} added
        </div>
      </div>
      <div class="message-input-group">
        <v-text-field
          variant="outlined"
          label=""
          hide-details="true"
          class="pa-0"
          v-model="myMessage"
        ></v-text-field>
        <v-btn color="primary" @click="sendMessage">Send</v-btn>
      </div>
    </v-main>

    <v-main v-else class="d-flex flex-column align-center justify-center">
      <v-card width="350px" class="pa-3">
        <v-text-field
          variant="solo"
          placeholder="Username"
          v-model="userId"
        ></v-text-field>
        <v-btn width="100%" color="primary" @click="logIn">Log In</v-btn>
      </v-card>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, watch } from "vue";
import { CometChat } from "@cometchat-pro/chat";

const theme = ref("dark");
const myAccount = ref({});
const loggedIn = ref(false);
const userId = ref("superhero1");
const groups = ref([]);
const myMessage = ref("");
const groupMessages = ref([]);
let selectedGroup = {};

function changeTheme() {
  theme.value = theme.value === "light" ? "dark" : "light";
}

const authKey = "5791fc9b99207a425427e4b193e0a2618804f410";

const appID = "2250625da760e0df";
const region = "us";
const appSetting = new CometChat.AppSettingsBuilder()
  .subscribePresenceForAllUsers()
  .setRegion(region)
  .build();

CometChat.init(appID, appSetting).then(
  () => {
    console.log("Initialization completed successfully");
  },
  (error) => {
    console.log("Initialization failed with error:", error);
  }
);

watch(loggedIn, (newLoggedIn) => {
  if (newLoggedIn) {
    let limit = 30;
    let groupsRequest = new CometChat.GroupsRequestBuilder()
      .setLimit(limit)
      .build();

    groupsRequest.fetchNext().then(
      (groupList) => {
        groups.value = groupList;
        console.log("Groups list fetched successfully", groupList);
      },
      (error) => {
        console.log("Groups list fetching failed with error", error);
      }
    );
  }
});

const logIn = () => {
  CometChat.login(userId.value, authKey).then(
    (user) => {
      console.log("Login Successful:", { user });
      loggedIn.value = true;
      myAccount.value = user;
      registerMessageListener()
    },
    (error) => {
      console.log("Login failed with exception:", { error });
    }
  );
};

const logOut = () => {
  CometChat.logout().then(
    () => {
      console.log("Logout completed successfully");
      myAccount.value = {};
      loggedIn.value = false;
    },
    (error) => {
      console.log("Logout failed with exception:", { error });
    }
  );
};

const onGroupSelected = (group) => {
  if (selectedGroup.guid !== group.guid) {
    selectedGroup = group;
    let GUID = group.guid;
    let limit = 30;
    let messagesRequest = new CometChat.MessagesRequestBuilder()
      .setGUID(GUID)
      .setLimit(limit)
      .build();

    messagesRequest.fetchPrevious().then(
      (messages) => {
        console.log("Message list fetched:", messages);
        groupMessages.value = messages.map(msg => msg);
      },
      (error) => {
        console.log("Message fetching failed with error:", error);
      }
    );
  }
};

const sendMessage = () => {
  let receiverID = selectedGroup.guid;
  let messageText = myMessage.value;
  let receiverType = CometChat.RECEIVER_TYPE.GROUP;
  let textMessage = new CometChat.TextMessage(
    receiverID,
    messageText,
    receiverType
  );

  CometChat.sendMessage(textMessage).then(
    (message) => {
      console.log("Message sent successfully:", message);
      groupMessages.value.push(message)
      myMessage.value = "";
    },
    (error) => {
      console.log("Message sending failed with error:", error);
    }
  );
};

const registerMessageListener = () => {
  let listenerID = myAccount.value.uid;
  console.log(listenerID)
  CometChat.addMessageListener(
      listenerID,
      new CometChat.MessageListener({
          onTextMessageReceived: textMessage => {
              console.log("Text message received successfully", textMessage);
              if(textMessage.receiver.guid === selectedGroup.guid) {
                groupMessages.value.push(textMessage)
                console.log(groupMessages.value)
              }
          },
          onMediaMessageReceived: mediaMessage => {
              console.log("Media message received successfully", mediaMessage);
          },
          onCustomMessageReceived: customMessage => {
              console.log("Custom message received successfully", customMessage);
          }
      })
  );
}

</script>

<style>
@import "./assets/scss/style.scss";

.message-input-group {
  position: fixed;
  bottom: 0;
  right: 0;
  width: calc(100% - 256px);

  display: flex;
  gap: 18px;
  align-items: center;

  padding: 8px 14px;
}

.message-input-group input {
  padding-top: 8px !important;
  padding-bottom: 8px !important;
}

.v-text-field .v-input__control .v-input__slot {
  min-height: auto !important;
  display: flex !important;
  align-items: center !important;
}

main {
  padding-bottom: 76px !important;
}
</style>
