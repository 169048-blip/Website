// 1. ตั้งค่า Firebase (ตรวจสอบ App ID และ Project ID ของคุณเรียบร้อยแล้ว)
const firebaseConfig = {
  apiKey: "AIzaSyCHNRvdVwkiFTyVCL8h8DLrQ6UtP3w0G7c",
  authDomain: "farm-4c384.firebaseapp.com",
  projectId: "farm-4c384",
  storageBucket: "farm-4c384.appspot.com",
  messagingSenderId: "1033838611987",
  appId: "1:1033838611987:web:2d42ae020360ba70a4f9e6",
  measurementId: "G-T8895S7N77"
};

// เปิดใช้งานระบบ
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ยอดเงินเริ่มต้น
let userBalance = 0;

// เมื่อโหลดเว็บ ให้ดึงข้อมูลสต็อกมาแสดงผล
window.onload = function() {
  updateStockDisplay(1);
  updateStockDisplay(2);
  updateStockDisplay(3);
};

// ระบบสลับหน้าจอ หน้าร้านค้า / เติมเงิน
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

// ระบบดึงสต็อกสินค้าจากตู้บัญชี accounts
function updateStockDisplay(productId) {
  db.collection("accounts")
    .where("productId", "==", productId)
    .where("status", "==", "available")
    .get()
    .then((querySnapshot) => {
      const count = querySnapshot.size;
      const element = document.getElementById(`stock-${productId}`);
      if (element) {
        element.innerText = count;
      }
    })
    .catch((error) => {
      console.error("โหลดสต็อกผิดพลาด: ", error);
    });
}

// ระบบปุ่มกดซื้อสินค้า (เมื่อกดแล้วจะเช็กยอดเงินทันที)
function buyProduct(productId, productName, price) {
  // บรรทัดนี้จะทำงานทันทีที่กดปุ่ม เพื่อเช็กเงินในกระเป๋าของคุณก่อน
  if (userBalance < price) {
    alert(`❌ ยอดเงินของคุณไม่เพียงพอ!\nสินค้านี้ราคา ${price} ฿\nแต่คุณมีเงินในระบบเพียง ${userBalance} ฿`);
    return;
  }

  // ค้นหาสินค้าในคลัง
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

        // สั่งเปลี่ยนสถานะเป็น sold
        db.collection("accounts").doc(accountId).update({
          status: "sold"
        }).then(() => {
          userBalance -= price;
          document.getElementById('balance').innerText = userBalance;
          updateStockDisplay(productId);
          alert(`🎉 ซื้อสินค้าสำเร็จ!\n\n🎁 สินค้า: ${productName}\n👤 ไอดี (Username): ${accountData.username}\n🔑 รหัสผ่าน (Password): ${accountData.password}`);
        }).catch((err) => {
          alert("เกิดข้อผิดพลาดในการตัดยอดคลังสินค้า");
          console.error(err);
        });
      });
    })
    .catch((error) => {
      alert("ไม่สามารถเชื่อมต่อระบบคลังข้อมูลได้ในขณะนี้");
      console.error(error);
    });
}

// ระบบรับซองแจ้งเติมเงินไปเก็บในตู้ข้อมูลหลังบ้าน เพื่อความปลอดภัย
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
    resultDiv.innerText = "❌ กรุณาระบุจำนวนยอดเงินในซองอั่งเปาให้ถูกต้อง";
    return;
  }

  const amount = parseFloat(amountInput);

  db.collection("topup_requests").add({
    truemoneyLink: linkInput,
    amount: amount,
    status: "pending",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    resultDiv.style.color = "orange";
    resultDiv.innerText = `⏳ แจ้งเงินสำเร็จ! ระบบกำลังส่งซองจำนวน ${amount} บาท ให้เจ้าของร้านตรวจสอบ โปรดรอเติมเครดิตใน 5-15 นาที`;
    document.getElementById('truemoney-link').value = "";
    document.getElementById('truemoney-amount').value = "";
  })
  .catch((error) => {
    resultDiv.style.color = "red";
    resultDiv.innerText = "❌ ไม่สามารถส่งข้อมูลอั่งเปาได้เนื่องจากระบบขัดข้อง";
    console.error(error);
  });
}