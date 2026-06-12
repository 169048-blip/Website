// เก็บบันทึกยอดเงินคงเหลือ
let currentBalance = parseFloat(localStorage.getItem('shopBalance')) || 0;
document.getElementById('balance').textContent = currentBalance;

// กำหนดจำนวนสินค้าเริ่มต้นชิ้นละ 5 ชิ้น (ดึงค่าเก่ามาใช้ถ้าเคยเปิดในเครื่องนี้)
let stock1 = localStorage.getItem('stockItem1') !== null ? parseInt(localStorage.getItem('stockItem1')) : 5;
let stock2 = localStorage.getItem('stockItem2') !== null ? parseInt(localStorage.getItem('stockItem2')) : 5;
let stock3 = localStorage.getItem('stockItem3') !== null ? parseInt(localStorage.getItem('stockItem3')) : 5;

document.getElementById('stock-1').textContent = stock1;
document.getElementById('stock-2').textContent = stock2;
document.getElementById('stock-3').textContent = stock3;

// ฟังก์ชันสลับหน้าเว็บ
function showSection(sectionName) {
    if (sectionName === 'shop') {
        document.getElementById('shop-section').classList.remove('d-none');
        document.getElementById('topup-section').classList.add('d-none');
    } else {
        document.getElementById('shop-section').classList.add('d-none');
        document.getElementById('topup-section').classList.remove('d-none');
    }
}

// ฟังก์ชันเติมเงินจำลอง
function processTopup() {
    const linkInput = document.getElementById('truemoney-link').value.trim();
    const amountInput = document.getElementById('truemoney-amount').value.trim();
    const resultDiv = document.getElementById('topup-result');
    
    resultDiv.textContent = "";
    resultDiv.style.backgroundColor = "transparent";

    if (linkInput === "" || amountInput === "") {
        alert("กรุณากรอกทั้งลิงก์ซองของขวัญและจำนวนเงินให้ครบถ้วนครับ");
        return;
    }

    if (!linkInput.includes("gift.truemoney.com/campaign/?v=")) {
        resultDiv.textContent = "❌ รูปแบบลิงก์ซองของขวัญไม่ถูกต้อง!";
        resultDiv.style.color = "#ef4444";
        resultDiv.style.backgroundColor = "#fee2e2";
        return;
    }

    const amount = parseFloat(amountInput);
    if (amount <= 0 || isNaN(amount)) {
        alert("กรุณาระบุจำนวนเงินที่ถูกต้องและมากกว่า 0 บาท");
        return;
    }

    currentBalance += amount;
    localStorage.setItem('shopBalance', currentBalance);
    document.getElementById('balance').textContent = currentBalance;

    resultDiv.textContent = `✅ ตรวจสอบสำเร็จ! ระบบได้รับเงินจำนวน ${amount} บาท และเพิ่มเครดิตให้คุณแล้ว`;
    resultDiv.style.color = "#065f46";
    resultDiv.style.backgroundColor = "#dcfce7";
    
    document.getElementById('truemoney-link').value = "";
    document.getElementById('truemoney-amount').value = "";
}

// ฟังก์ชันซื้อสินค้า (คำนวณแยกตามไอเทม 3 ชิ้น)
function buyProduct(productId, productName, price) {
    let currentStock;
    if (productId === 1) currentStock = stock1;
    else if (productId === 2) currentStock = stock2;
    else if (productId === 3) currentStock = stock3;

    // 1. เช็กสต็อก
    if (currentStock <= 0) {
        alert("❌ ขออภัยด้วยครับ สินค้ารายการนี้หมดคลังชั่วคราว!");
        return;
    }

    // 2. เช็กเงิน
    if (currentBalance < price) {
        alert(`❌ เครดิตไม่พอ! สินค้าราคา ${price} ฿ แต่คุณมีเพียง ${currentBalance} ฿ กรุณาไปเติมเงินอั่งเปาก่อนครับ`);
        return;
    }

    // 3. หักเงินและหักสต็อก
    currentBalance -= price;
    localStorage.setItem('shopBalance', currentBalance);
    document.getElementById('balance').textContent = currentBalance;

    if (productId === 1) {
        stock1--;
        localStorage.setItem('stockItem1', stock1);
        document.getElementById('stock-1').textContent = stock1;
    } else if (productId === 2) {
        stock2--;
        localStorage.setItem('stockItem2', stock2);
        document.getElementById('stock-2').textContent = stock2;
    } else if (productId === 3) {
        stock3--;
        localStorage.setItem('stockItem3', stock3);
        document.getElementById('stock-3').textContent = stock3;
    }

    // แจ้งเตือนสุ่มรหัสผ่านไอดี Roblox ส่งให้ผู้ซื้อ
    alert(`🎉 ซื้อสำเร็จ!\nสินค้า: ${productName}\n\n[ข้อมูลไอดี Roblox ของคุณ]\nUSER: Roblox_ZombiePlayer_${Math.floor(Math.random() * 80) + 10}\nPASS: ZmBArena${Math.floor(Math.random() * 9000) + 1000}\n\n⚠️ เพื่อความปลอดภัย อย่าลืมเปิดระบบอัดวิดีโอและเปลี่ยนรหัสผ่านทันทีครับ`);
}