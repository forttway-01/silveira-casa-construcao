const container = document.getElementById("slidesContainer")
const dotsContainer = document.getElementById("sliderDots")

let slides=[]
let index=0
let startX=0

async function loadBanners(){

const res = await fetch("data/banners.json")
const data = await res.json()

slides=data

renderSlides()

}

function renderSlides(){

container.innerHTML=""
dotsContainer.innerHTML=""

slides.forEach((b,i)=>{

const slide=document.createElement("div")
slide.className="slide"

slide.innerHTML=`

<img src="${b.image}">

<div class="bannerContent">

<h2>${b.title}</h2>
<p>${b.text}</p>

<a href="${b.link}" class="bannerBtn">
${b.button}
</a>

</div>

`

container.appendChild(slide)

const dot=document.createElement("span")

dot.onclick=()=>{

index=i
showSlide()

}

dotsContainer.appendChild(dot)

})

showSlide()

}

function showSlide(){

document.querySelectorAll(".slide")
.forEach(s=>s.classList.remove("active"))

document.querySelectorAll(".sliderDots span")
.forEach(d=>d.classList.remove("active"))

document.querySelectorAll(".slide")[index]
.classList.add("active")

dotsContainer.children[index].classList.add("active")

}

function nextSlide(){

index++

if(index>=slides.length){

index=0

}

showSlide()

}

function prevSlide(){

index--

if(index<0){

index=slides.length-1

}

showSlide()

}

document.getElementById("nextSlide").onclick=nextSlide
document.getElementById("prevSlide").onclick=prevSlide

/* swipe mobile */

container.addEventListener("touchstart",(e)=>{

startX=e.touches[0].clientX

})

container.addEventListener("touchend",(e)=>{

let endX=e.changedTouches[0].clientX

if(startX-endX>50) nextSlide()
if(endX-startX>50) prevSlide()

})

/* autoplay */

setInterval(nextSlide,5000)

loadBanners()