let userBalance = 0;

const firebaseConfig = {
  apiKey: "AIzaSyCHNRvdVwkiFTyVCL8h8DLrQ6UtP3w0G7c",
  authDomain: "farm-4c384.firebaseapp.com",
  projectId: "farm-4c384",
  storageBucket: "farm-4c384.appspot.com",
  messagingSenderId: "1033838611987",
  appId: "1:1033838611987:web:2d42ae020360ba70a4f9e6",
  measurementId: "G-T8895S7N77"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

window.onload = function() {
  updateStockDisplay(1);
  updateStockDisplay(2);
  updateStockDisplay(3);
};

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

function updateStockDisplay(productId) {
  db.collection("accounts")
    .where("productid", "==", productId)
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

function buyProduct(productId, productName, price) {
  if (userBalance < price) {
    alert(`❌ ยอดเงินของคุณไม่เพียงพอ!\nสินค้านี้ราคา ${price} ฿\nแต่คุณมีเงินในระบบเพียง ${userBalance} ฿`);
    return;
  }

  db.collection("accounts")
    .where("productid", "==", productId)
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

        db.collection("accounts").doc(accountId).update({
          status: "sold"
        }).then(() => {
          userBalance -= price;
          document.getElementById('balance').innerText = userBalance;
          updateStockDisplay(productId);
          alert(`🎉 ซื้อสินค้าสำเร็จ!\n\n🎁 สินค้า: ${productName}\n👤 ไอดี: ${accountData.username}\n🔑 รหัสผ่าน: ${accountData.password}`);
        }).catch((err) => {
          alert("เกิดข้อผิดพลาดในการตัดยอดสต็อก");
        });
      });
    })
    .catch((error) => {
      alert("ไม่สามารถเชื่อมต่อฐานข้อมูลคลังสินค้าได้");
    });
}

function processTopup() {
  const linkInput = document.getElementById('truemoney-link').value.trim();
  const amountInput = document.getElementById('truemoney-amount').value;
  const resultDiv = document.getElementById('topup-result');

  if (!linkInput.includes("gift.truemoney.com")) {
    resultDiv.style.color = "red";
    resultDiv.innerText = "❌ ลิงก์ซองของขวัญไม่ถูกต้อง";
    return;
  }
  if (!amountInput || amountInput <= 0) {
    resultDiv.style.color = "red";
    resultDiv.innerText = "❌ กรุณาระบุจำนวนเงินให้ถูกต้อง";
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
    resultDiv.innerText = `⏳ แจ้งเงินสำเร็จ! จำนวน ${amount} บาท โปรดรอเจ้าของร้านตรวจสอบและอนุมัติเครดิต`;
    document.getElementById('truemoney-link').value = "";
    document.getElementById('truemoney-amount').value = "";
  })
  .catch((error) => {
    resultDiv.style.color = "red";
    resultDiv.innerText = "❌ เกิดข้อผิดพลาด ไม่สามารถส่งข้อมูลได้";
  });
}