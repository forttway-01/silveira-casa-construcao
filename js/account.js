import { auth } from "./firebase.js"

import { onAuthStateChanged }

from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"

onAuthStateChanged(auth,(user)=>{

if(user){

document.getElementById("accountEmail").textContent =
user.email

}else{

location.href="login.html"

}

})