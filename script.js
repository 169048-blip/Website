// 1. กำหนดค่าการเชื่อมต่อฐานข้อมูล Firebase ของคุณ
const firebaseConfig = {
  apiKey: "AIzaSyCHNRvdVwkiFTyVCL8h8DLrQ6UtP3w0G7c",
  authDomain: "farm-4c384.firebaseapp.com",
  projectId: "farm-4c384",
  storageBucket: "farm-4c384.appspot.com",
  messagingSenderId: "1033838611987",
  appId: "1:1033838611987:web:2d42ae020360ba70a4f9e6",
  measurementId: "G-T8895S7N77"
};

// เริ่มต้นระบบ Firebase และ Firestore
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ยอดเครดิตจำลองในกระเป๋าเงิน (เริ่มต้นที่ 0 บาท)
let userBalance = 0;

// เมื่อหน้าเว็บโหลดสำเร็จ ให้ดึงยอดสต็อกสินค้ามาแสดงผลทันที
window.onload = function() {
    updateStockDisplay(1); // หมวดหมู่ 1: รหัสเงิน
    updateStockDisplay(2); // หมวดหมู่ 2: รหัสของ
    updateStockDisplay(3); // หมวดหมู่ 3: รหัสคลาส
};

// ฟังก์ชันสลับหน้าจอระหว่าง หน้าร้านค้า และ หน้าเติมเงิน
function showSection(section) {
    const shopSec = document.getElementById('shop-section');
    const topupSec = document.getElementById('topup-section');
    
    if (section === 'shop') {
        shopSec.classList.remove('d-none');
        topupSec.classList.add('d-none');
    } else if (section === 'topup') {
        shopSec.classList.add('d-none');
        topupSec.classList.remove('d-none');
    }
}

// ฟังก์ชันสำหรับเช็กและดึงจำนวนสินค้าที่ยังไม่ถูกขาย (available) มาอัปเดตบนหน้าเว็บ
function updateStockDisplay(productId) {
    db.collection("accounts")
      .where("productId", "==", productId)
      .where("status", "==", "available")
      .get()
      .then((querySnapshot) => {
          const count = querySnapshot.size;
          document.getElementById(`stock-${productId}`).innerText = count;
      })
      .catch((error) => {
          console.error("โหลดสต็อกผิดพลาด: ", error);
      });
}

// ฟังก์ชันระบบซื้อสินค้าและตัดสต็อกอัตโนมัติ
function buyProduct(productId, productName, price) {
    // ตรวจสอบเงินในกระเป๋า
    if (userBalance < price) {
        alert(`❌ ยอดเงินของคุณไม่เพียงพอ! สินค้านี้ราคา ${price} ฿ แต่คุณมีเพียง ${userBalance} ฿`);
        return;
    }

    // ค้นหารหัสสินค้าที่พร้อมขาย 1 ตัว
    db.collection("accounts")
      .where("productId", "==", productId)
      .where("status", "==", "available")
      .limit(1)
      .get()
      .then((querySnapshot) => {
          
          if (querySnapshot.empty) {
              alert(`❌ ขออภัยครับ [${productName}] หมดสต็อกแล้ว!`);
              return;
          }

          querySnapshot.forEach((doc) => {
              const accountId = doc.id;
              const accountData = doc.data();

              // เปลี่ยนสถานะเป็น sold (ขายแล้ว) ทันที
              db.collection("accounts").doc(accountId).update({
                  status: "sold"
              }).then(() => {
                  // หักเงินผู้ใช้และอัปเดตยอดเงินบนหน้าจอ
                  userBalance -= price;
                  document.getElementById('balance').innerText = userBalance;
                  
                  // อัปเดตสต็อกสินค้าใหม่
                  updateStockDisplay(productId);

                  // ส่งมอบรหัสเกมให้ลูกค้า
                  alert(`🎉 ซื้อสินค้าสำเร็จ!\n\n🎁 สินค้า: ${productName}\n👤 ไอดี (Username): ${accountData.username}\n🔑 รหัสผ่าน (Password): ${accountData.password}\n\n*โปรดอัดวิดีโอและเปลี่ยนรหัสผ่านทันที*`);
              }).catch((err) => {
                  alert("เกิดข้อผิดพลาดในการตัดระบบสต็อก");
                  console.error(err);
              });
          });
      })
      .catch((error) => {
          alert("ไม่สามารถเชื่อมต่อฐานข้อมูลได้");
          console.error(error);
      });
}

// ฟังก์ชันระบบจำลองเติมเงินอั่งเปา TrueMoney Wallet
function processTopup() {
    const linkInput = document.getElementById('truemoney-link').value.trim();
    const amountInput = document.getElementById('truemoney-amount').value;
    const resultDiv = document.getElementById('topup-result');

    if (!linkInput.includes("gift.truemoney.com")) {
        resultDiv.style.color = "red";
        resultDiv.innerText = "❌ ลิงก์ซองของขวัญไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง";
        return;
    }
    if (!amountInput || amountInput <= 0) {
        resultDiv.style.color = "red";
        resultDiv.innerText = "❌ กรุณาระบุจำนวนเงินในซองให้ถูกต้อง";
        return;
    }

    // เพิ่มเครดิตเข้ากระเป๋าเงิน
    const amount = parseFloat(amountInput);
    userBalance += amount;
    
    document.getElementById('balance').innerText = userBalance;
    
    resultDiv.style.color = "green";
    resultDiv.innerText = `✅ เติมเงินสำเร็จ! เพิ่มเครดิตจำนวน ${amount} บาท เรียบร้อยแล้ว`;
    
    // ล้างช่องกรอกข้อมูล
    document.getElementById('truemoney-link').value = "";
    document.getElementById('truemoney-amount').value = "";
}