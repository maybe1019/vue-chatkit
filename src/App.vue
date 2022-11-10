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
        <v-icon v-bind:icon="theme === 'light' ? 'mdi-weather-sunny' : 'mdi-weather-night'"></v-icon>
      </v-btn>
    </v-app-bar>


    <v-navigation-drawer v-if="loggedIn" floating permanent>
      <v-list density="compact" nav>
        <v-list-item v-for="group in groups" :key="group.guid" :value="group.guid">
          <v-avatar :image="group.icon"></v-avatar>
          {{ group.name }}
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main v-if="loggedIn">

    </v-main>

    <v-main v-else class="d-flex flex-column align-center justify-center">
      <v-card width="350px" class="pa-3">
        <v-text-field variant="solo" placeholder="Username" v-model="UID"></v-text-field>
        <v-btn width="100%" color="primary" @click="logIn">Log In</v-btn>
      </v-card>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, watch } from 'vue'
import { CometChat } from "@cometchat-pro/chat";

const theme = ref('dark')
const myAccount = ref({})
const loggedIn = ref(false)
const UID = ref("superhero3")
const groups = ref([])


function changeTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

const authKey = '5791fc9b99207a425427e4b193e0a2618804f410'; //eslint-disable-line

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
  error => {
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
      groupList => {
        groups.value = groupList
        console.log("Groups list fetched successfully", groupList);
      }, error => {
        console.log("Groups list fetching failed with error", error);
      }
    );
  }
})

const logIn = () => {
  CometChat.getLoggedinUser().then(user => {
    if (!user) {
      CometChat.login(UID.value, authKey).then(
        user => {
          console.log("Login Successful:", { user });
          loggedIn.value = true
          myAccount.value = user
        }, error => {
          console.log("Login failed with exception:", { error });
        }
      );
    }
    else {
      loggedIn.value = true
      myAccount.value = user
      console.log('Loginned User', user)
    }
  }, error => {
    console.log("Something went wrong", error);
  });
}

const logOut = () => {
  CometChat.logout().then(
    () => {
      console.log("Logout completed successfully");
      myAccount.value = {}
      loggedIn.value = false
    }, error => {
      console.log("Logout failed with exception:", { error });
    }
  );
}

</script>

<style>
@import './assets/scss/style.scss';
</style>
