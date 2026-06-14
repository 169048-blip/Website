// 1. รหัสกุญแจเชื่อมต่อเข้าฐานข้อมูล Firebase (อัปเดตถูกต้องตามหน้าโปรเจกต์ของคุณแล้ว)
const firebaseConfig = {
  apiKey: "AIzaSyCHNRvdVwkiFTyVCL8h8DLrQ6UtP3w0G7c",
  authDomain: "farm-4c384.firebaseapp.com",
  projectId: "farm-4c384",
  storageBucket: "farm-4c384.appspot.com",
  messagingSenderId: "1033838611987",
  appId: "1:1033838611987:web:2d42ae020360ba70a4f9e6",  // แก้ไขเป็นตัว a เรียบร้อย
  measurementId: "G-T8895S7N77"
};

// เริ่มต้นเปิดระบบฐานข้อมูล
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ตัวแปรเก็บจำนวนเงินจำลองในกระเป๋า (เริ่มต้นที่ 0 บาท)
let userBalance = 0;

// เมื่อหน้าเว็บโหลดเสร็จ ให้ดึงจำนวนสต็อกสินค้าจาก Firebase มาแสดงทันที
window.onload = function() {
    updateStockDisplay(1); // รหัสเงิน
    updateStockDisplay(2); // รหัสของ
    updateStockDisplay(3); // รหัสคลาส
};

// ฟังก์ชันสำหรับสลับหน้าจอ (หน้าร้านค้า / หน้าเติมเงิน)
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

// ฟังก์ชันสำหรับดึงจำนวนสต็อกที่เหลืออยู่จริงมาแสดงบนหน้าเว็บ
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

// ฟังก์ชันระบบซื้อสินค้า (แยกตามประเภท และตรวจสอบยอดเงิน)
function buyProduct(productId, productName, price) {
    // 1. ตรวจสอบว่าเงินในกระเป๋าของลูกค้าพอหรือไม่
    if (userBalance < price) {
        alert(`❌ ยอดเงินของคุณไม่เพียงพอ! สินค้านี้ราคา ${price} ฿ แต่คุณมีเพียง ${userBalance} ฿`);
        return;
    }

    // 2. ค้นหารหัสเกมในประเภทสินค้าที่เลือก (productId) และยังไม่ได้ขาย (available)
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

              // 3. ทำการล็อกและเปลี่ยนสถานะรหัสในคลังให้เป็น sold ทันทีเพื่อไม่ให้คนอื่นได้ซ้ำ
              db.collection("accounts").doc(accountId).update({
                  status: "sold"
              }).then(() => {
                  // 4. หักเงินในกระเป๋าของผู้ใช้
                  userBalance -= price;
                  document.getElementById('balance').innerText = userBalance;
                  
                  // 5. อัปเดตตัวเลขสต็อกคงเหลือบนหน้าเว็บใหม่
                  updateStockDisplay(productId);

                  // 6. ส่งมอบไอดีและรหัสผ่านให้ลูกค้าเห็น
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

// ฟังก์ชันระบบเติมเงินอั่งเปาจำลอง
function processTopup() {
    const linkInput = document.getElementById('truemoney-link').value.trim();
    const amountInput = document.getElementById('truemoney-amount').value;
    const resultDiv = document.getElementById('topup-result');

    // ตรวจสอบข้อมูลเบื้องต้น
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

    // ทำงานเพิ่มเงินเข้าสู่กระเป๋าจำลอง
    const amount = parseFloat(amountInput);
    userBalance += amount;
    
    // อัปเดตเงินในกระเป๋าขึ้นหน้าจอ
    document.getElementById('balance').innerText = userBalance;
    
    resultDiv.style.color = "green";
    resultDiv.innerText = `✅ เติมเงินสำเร็จ! เพิ่มเครดิตจำนวน ${amount} บาท เรียบร้อยแล้ว`;
    
    // ล้างช่องกรอกข้อมูล
    document.getElementById('truemoney-link').value = "";
    document.getElementById('truemoney-amount').value = "";
}