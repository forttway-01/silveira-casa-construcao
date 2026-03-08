// public/js/auth.js
import { auth, db } from "./firebase.js";

import {

createUserWithEmailAndPassword,
signInWithEmailAndPassword,
GoogleAuthProvider,
signInWithPopup,
sendPasswordResetEmail,
onAuthStateChanged,
signOut

}

from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import {

doc,
setDoc,
serverTimestamp

}

from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

/* ELEMENTOS */

const email = document.getElementById("email")
const password = document.getElementById("password")

const loginBtn = document.getElementById("loginBtn")
const registerBtn = document.getElementById("registerBtn")
const googleBtn = document.getElementById("googleLogin")
const resetBtn = document.getElementById("resetPassword")
const logoutBtn = document.getElementById("logoutBtn")

/* =========================
CRIAR CONTA
========================= */

if(registerBtn){

registerBtn.onclick = async ()=>{

try{

const userCredential = await createUserWithEmailAndPassword(
auth,
email.value,
password.value
)

const user = userCredential.user

/* salvar perfil no Firestore */

await setDoc(doc(db,"users",user.uid),{

email:user.email,
createdAt:serverTimestamp(),
role:"cliente"

})

console.log("Usuário criado:",user)

alert("Conta criada com sucesso!")

}catch(error){

console.error("Erro ao criar conta:",error)

alert(error.message)

}

}

}

/* =========================
LOGIN
========================= */

if(loginBtn){

loginBtn.onclick = async ()=>{

try{

const userCredential = await signInWithEmailAndPassword(
auth,
email.value,
password.value
)

console.log("Login OK:",userCredential.user)

location.href="index.html"

}catch(error){

console.error("Erro login:",error)

alert(error.message)

}

}

}

/* =========================
LOGIN GOOGLE
========================= */

if(googleBtn){

googleBtn.onclick = async ()=>{

const provider = new GoogleAuthProvider()

try{

const result = await signInWithPopup(auth,provider)

console.log("Google login:",result.user)

location.href="index.html"

}catch(error){

console.error(error)

}

}

}

/* =========================
RESET SENHA
========================= */

if(resetBtn){

resetBtn.onclick = async ()=>{

try{

await sendPasswordResetEmail(auth,email.value)

alert("Email de recuperação enviado!")

}catch(error){

alert(error.message)

}

}

}

/* =========================
LOGOUT
========================= */

if(logoutBtn){

logoutBtn.onclick = async ()=>{

await signOut(auth)

location.reload()

}

}

/* =========================
SAUDAÇÃO USUÁRIO
========================= */

onAuthStateChanged(auth,(user)=>{

if(user){

console.log("Usuário logado:",user.email)

const name = document.getElementById("userName")
const avatar = document.getElementById("userAvatar")

if(name){
name.textContent = user.displayName || user.email
}

if(user.photoURL && avatar){
avatar.src = user.photoURL
}

}else{

console.log("Nenhum usuário logado")

}

})