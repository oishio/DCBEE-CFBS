import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyDOClS6MuNGaaTOeL4NGdh1jThCeur20J8",
    authDomain: "dcbee-cfbs.firebaseapp.com",
    databaseURL: "https://dcbee-cfbs-default-rtdb.firebaseio.com",
    projectId: "dcbee-cfbs",
    storageBucket: "dcbee-cfbs.firebasestorage.app",
    messagingSenderId: "571164317131",
    appId: "1:571164317131:web:084f26c6a9eb8e2e4e524e",
    measurementId: "G-XKWS0GJVPC"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app); 