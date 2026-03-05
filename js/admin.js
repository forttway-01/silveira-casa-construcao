const STORAGE = "catalog_products"

const form = document.getElementById("productForm")

const idInput = document.getElementById("id")
const nameInput = document.getElementById("name")
const priceInput = document.getElementById("price")
const categoryInput = document.getElementById("category")
const imageInput = document.getElementById("image")

const offerInput = document.getElementById("isOffer")
const oldPriceInput = document.getElementById("oldPrice")

const list = document.getElementById("productList")

const editIndexInput = document.getElementById("editIndex")

const exportBtn = document.getElementById("exportBtn")
const importBtn = document.getElementById("importBtn")
const fileInput = document.getElementById("fileInput")

const deleteBtn = document.getElementById("deleteBtn")
const resetBtn = document.getElementById("resetBtn")

let products = load()

function load(){

const raw = localStorage.getItem(STORAGE)

if(!raw) return []

return JSON.parse(raw)

}

function save(){

localStorage.setItem(STORAGE, JSON.stringify(products))

render()

}

function render(){

list.innerHTML=""

products.forEach((p,i)=>{

const div = document.createElement("div")

div.className="productItem"

div.innerHTML = `
<b>${p.name}</b><br>
${p.category} • R$ ${p.price}
${p.isOffer ? "🔥 Oferta":""}
`

div.onclick = () => edit(i)

list.appendChild(div)

})

}

function edit(index){

const p = products[index]

editIndexInput.value=index

idInput.value=p.id
nameInput.value=p.name
priceInput.value=p.price
categoryInput.value=p.category
imageInput.value=p.image

offerInput.checked = p.isOffer

oldPriceInput.value = p.oldPrice || ""

toggleOldPrice()

}

form.onsubmit = e => {

e.preventDefault()

const product = {

id:idInput.value,
name:nameInput.value,
price:Number(priceInput.value),
category:categoryInput.value,
image:"assets/products/"+imageInput.value,
isOffer:offerInput.checked

}

if(offerInput.checked && oldPriceInput.value){

product.oldPrice = Number(oldPriceInput.value)

}

const editIndex = editIndexInput.value

if(editIndex){

products[editIndex] = product

}else{

products.push(product)

}

save()

form.reset()

editIndexInput.value=""

toggleOldPrice()

}

function toggleOldPrice(){
  if (offerInput.checked) {
    oldPriceInput.disabled = false;

    // sugere um "de" automático se estiver vazio
    if (!oldPriceInput.value) {
      const price = Number(priceInput.value || 0);
      if (price > 0) {
        oldPriceInput.value = (price * 1.15).toFixed(2);
      }
    }
  } else {
    oldPriceInput.disabled = true;
    oldPriceInput.value = "";
  }
}

offerInput.onchange = toggleOldPrice

deleteBtn.onclick = () => {

const i = editIndexInput.value

if(i==="") return

products.splice(i,1)

save()

form.reset()

}

resetBtn.onclick = () => {

form.reset()

editIndexInput.value=""

}

exportBtn.onclick = () => {

const data = JSON.stringify(products,null,2)

const blob = new Blob([data],{type:"application/json"})

const url = URL.createObjectURL(blob)

const a = document.createElement("a")

a.href=url

a.download="products.json"

a.click()

}

importBtn.onclick = ()=> fileInput.click()

fileInput.onchange = e => {

const file = e.target.files[0]

const reader = new FileReader()

reader.onload = () => {

products = JSON.parse(reader.result)

save()

}

reader.readAsText(file)

}

render()