import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, setDoc, getDoc, doc, deleteDoc, updateDoc, serverTimestamp, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAZoW7ubdmpDDmBH3APaKacm0w9IUKBfsU",
  authDomain: "harcama-takip-2ef47.firebaseapp.com",
  projectId: "harcama-takip-2ef47",
  storageBucket: "harcama-takip-2ef47.firebasestorage.app",
  messagingSenderId: "299288965320",
  appId: "1:299288965320:web:b8aea4157828223eabf5fd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const adminView = document.getElementById('admin-view');
const displayUsername = document.getElementById('display-username');
const btnAdminPanel = document.getElementById('btn-admin-panel');

let expenseChart;
let globalExpenses = [];
let currentChartFilter = 'weekly';
let appConfig = {}; 

async function loadAppConfig() {
    const docRef = doc(db, "settings", "app_config_v2");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists() && docSnap.data().items) {
        appConfig = docSnap.data();
    } else {
        appConfig = {
            tolerance: 20, 
            categories: [
                { id: "yeme_icme", name: "Yeme & İçme", placeholder: "Örn: Dürüm yedi, kahve içti..." },
                { id: "market", name: "Market", placeholder: "Örn: Cips, mutfak alışverişi..." },
                { id: "ulasim", name: "Ulaşım", placeholder: "Örn: TCDD bilet, benzin..." },
                { id: "egitim", name: "Eğitim", placeholder: "Örn: Almanca seti, defter..." },
                { id: "abonelikler", name: "Abonelikler", placeholder: "Örn: Netflix, Spotify..." },
                { id: "web_proje", name: "Web & Proje", placeholder: "Örn: Vercel, domain..." },
                { id: "oyun_dijital", name: "Oyun & Dijital", placeholder: "Örn: Steam, Taş yığını..." },
                { id: "yatirim", name: "Yatırım", placeholder: "Örn: Kripto, altın..." },
                { id: "faturalar", name: "Faturalar", placeholder: "Örn: Elektrik, internet..." },
                { id: "giyim_kozmetik", name: "Giyim & Kozmetik", placeholder: "Örn: Ayakkabı, parfüm..." },
                { id: "ev_esyasi", name: "Ev Eşyası", placeholder: "Örn: Vantilatör, banyo rafı..." }
            ],
            items: [
                { name: "0.5L su", price: 5, action: "alabilirdin" },
                { name: "gofret", price: 15, action: "alabilirdin" },
                { name: "ayran", price: 20, action: "alabilirdin" },
                { name: "tofaş", price: 118695, action: "alabilirdin" },
                { name: "bedelli askerlik", price: 425000, action: "yapabilirdin" }
            ]
        };
        await setDoc(docRef, appConfig);
    }
    populateUI();
}

function populateUI() {
    const catSelect = document.getElementById('category');
    const filterSelect = document.getElementById('history-filter');
    catSelect.innerHTML = '<option value="" disabled selected>Kategori Seç...</option>';
    filterSelect.innerHTML = '<option value="all">Tüm Kategoriler</option>';

    appConfig.categories.forEach(c => {
        catSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        filterSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });
}

document.getElementById('category').addEventListener('change', (e) => {
    const cat = appConfig.categories.find(c => c.id === e.target.value);
    document.getElementById('detail').placeholder = cat ? cat.placeholder : "Örn: Ne aldın?";
});

// --- AUTH & PROFİL MENÜSÜ AÇ/KAPA ---
const profileBtn = document.getElementById('profile-btn');
const profileMenu = document.getElementById('profile-menu');

profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle('hidden');
});
document.addEventListener('click', (e) => {
    if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.classList.add('hidden');
    }
});

// YENİ: ŞİFRE SIFIRLAMA
document.getElementById('btn-change-pass').addEventListener('click', async () => {
    const email = auth.currentUser.email;
    if(confirm(`${email} adresine şifre sıfırlama linki göndereyim mi kanka?`)) {
        try {
            await sendPasswordResetEmail(auth, email);
            alert("Sıfırlama linki mailine yollandı, kontrol et!");
            profileMenu.classList.add('hidden');
        } catch(error) {
            alert("Hata oldu: " + error.message);
        }
    }
});

document.getElementById('tab-login').addEventListener('click', (e) => {
    e.target.classList.add('active'); document.getElementById('tab-register').classList.remove('active');
    document.getElementById('login-form').classList.remove('hidden'); document.getElementById('register-form').classList.add('hidden');
});
document.getElementById('tab-register').addEventListener('click', (e) => {
    e.target.classList.add('active'); document.getElementById('tab-login').classList.remove('active');
    document.getElementById('register-form').classList.remove('hidden'); document.getElementById('login-form').classList.add('hidden');
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-pass').value;
    try {
        const q = query(collection(db, "users"), where("username", "==", username));
        if (!(await getDocs(q)).empty) return document.getElementById('auth-error').innerText = "Kullanıcı adı alınmış!";
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const role = (email === "admin@gmail.com") ? "admin" : "user";
        await setDoc(doc(db, "users", userCred.user.uid), { username, email, role, createdAt: serverTimestamp() });
    } catch (error) { document.getElementById('auth-error').innerText = "Hata: " + error.message; }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await signInWithEmailAndPassword(auth, document.getElementById('login-email').value, document.getElementById('login-pass').value); } 
    catch (error) { document.getElementById('auth-error').innerText = "Şifre/Email yanlış aga."; }
});
document.getElementById('btn-logout').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
    if (user) {
        authView.classList.add('hidden'); dashboardView.classList.remove('hidden');
        await loadAppConfig(); 
        
        const userDocQuery = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
        if (!userDocQuery.empty) {
            const userData = userDocQuery.docs[0].data();
            displayUsername.innerText = `Hoş geldin, ${userData.username}`;
            if(userData.role === "admin") btnAdminPanel.classList.remove('hidden');
            else btnAdminPanel.classList.add('hidden');
        }
        initChart(); fetchAndRenderData();
    } else {
        dashboardView.classList.add('hidden'); authView.classList.remove('hidden'); adminView.classList.add('hidden');
    }
});

// --- ADMİN PANELİ ---
btnAdminPanel.addEventListener('click', async () => {
    dashboardView.classList.add('hidden');
    adminView.classList.remove('hidden');
    loadAdminUsers();
    loadAdminSettings();
});

document.getElementById('btn-back-dashboard').addEventListener('click', () => {
    adminView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    populateUI(); 
});

async function loadAdminUsers() {
    const tbody = document.getElementById('admin-users-body');
    tbody.innerHTML = '<tr><td colspan="3">Yükleniyor...</td></tr>';
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(10)); 
    const snapshot = await getDocs(q);
    
    tbody.innerHTML = '';
    snapshot.forEach(doc => {
        const u = doc.data();
        const dateStr = u.createdAt ? new Date(u.createdAt.toMillis()).toLocaleDateString('tr-TR') : 'Bilinmiyor';
        tbody.innerHTML += `
            <tr>
                <td><strong>${u.username}</strong> ${u.role==='admin'?'👑':''}</td>
                <td style="color:var(--text-muted)">${u.email}</td>
                <td>${dateStr}</td>
            </tr>
        `;
    });
}

function loadAdminSettings() {
    const catList = document.getElementById('admin-cat-list');
    catList.innerHTML = '';
    appConfig.categories.forEach((c, index) => {
        catList.innerHTML += `
            <li>
                <span style="font-weight:600;">${c.name}</span>
                <button class="icon-btn del-btn" onclick="deleteCategory(${index})"><i class="fa-solid fa-trash"></i></button>
            </li>
        `;
    });

    const tolInput = document.getElementById('admin-tolerance');
    if(tolInput) tolInput.value = appConfig.tolerance !== undefined ? appConfig.tolerance : 20;

    const itemList = document.getElementById('admin-item-list');
    itemList.innerHTML = '';
    appConfig.items.sort((a, b) => b.price - a.price).forEach((item, index) => {
        itemList.innerHTML += `
            <div style="display: flex; gap: 5px; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; border: 1px solid #333; align-items: center;">
                <input type="text" id="i-name-${index}" value="${item.name}" style="margin:0; flex: 2; padding: 8px;">
                <input type="number" id="i-price-${index}" value="${item.price}" style="margin:0; flex: 1; padding: 8px;">
                <input type="text" id="i-action-${index}" value="${item.action}" style="margin:0; flex: 1.5; padding: 8px;">
                <button class="icon-btn del-btn" onclick="deleteItem(${index})" style="margin: 0 0 0 5px;"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    });
}

document.getElementById('btn-add-cat').addEventListener('click', async () => {
    const name = document.getElementById('new-cat-name').value;
    const placeholder = document.getElementById('new-cat-placeholder').value;
    if(!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    appConfig.categories.push({ id, name, placeholder });
    await saveSettingsToDB();
    document.getElementById('new-cat-name').value = '';
    document.getElementById('new-cat-placeholder').value = '';
    loadAdminSettings();
});

window.deleteCategory = async (index) => {
    if(confirm("Kategoriyi sileyim mi?")) {
        appConfig.categories.splice(index, 1);
        await saveSettingsToDB();
        loadAdminSettings();
    }
};

document.getElementById('btn-add-item').addEventListener('click', async () => {
    const name = document.getElementById('new-item-name').value;
    const price = parseFloat(document.getElementById('new-item-price').value);
    const action = document.getElementById('new-item-action').value;
    
    if(!name || isNaN(price) || !action) return alert("Hepsini doldur aga!");
    
    appConfig.items.push({ name, price, action });
    await saveSettingsToDB();
    document.getElementById('new-item-name').value = '';
    document.getElementById('new-item-price').value = '';
    document.getElementById('new-item-action').value = '';
    loadAdminSettings();
});

window.deleteItem = async (index) => {
    if(confirm("Bu ürünü listeden uçurayım mı?")) {
        appConfig.items.splice(index, 1);
        await saveSettingsToDB();
        loadAdminSettings();
    }
};

document.getElementById('btn-save-items').addEventListener('click', async () => {
    appConfig.tolerance = parseFloat(document.getElementById('admin-tolerance').value) || 20;

    appConfig.items.forEach((item, index) => {
        item.name = document.getElementById(`i-name-${index}`).value;
        item.price = parseFloat(document.getElementById(`i-price-${index}`).value);
        item.action = document.getElementById(`i-action-${index}`).value;
    });
    await saveSettingsToDB();
    alert("Ayarlar, ürünler ve yüzdelik oran başarıyla güncellendi kanka!");
    loadAdminSettings();
});

async function saveSettingsToDB() {
    await setDoc(doc(db, "settings", "app_config_v2"), appConfig);
}

// --- ZEKİ SEÇİM MOTORU ---
function getFunnyText(amount) {
    if (!appConfig.items || appConfig.items.length === 0) return "hesaplayamadım, bir şeyler ters gitti";

    let tolerance = appConfig.tolerance !== undefined ? appConfig.tolerance : 20;
    let minPrice = amount * (1 - (tolerance / 100));
    let maxPrice = amount * (1 + (tolerance / 100));

    let affordableItems = appConfig.items.filter(item => item.price >= minPrice && item.price <= maxPrice);

    if (affordableItems.length > 0) {
        let selectedItem = affordableItems[Math.floor(Math.random() * affordableItems.length)];
        return `${selectedItem.name} ${selectedItem.action}`;
    } else {
        let cheaperItems = appConfig.items.filter(item => item.price <= amount);
        if (cheaperItems.length === 0) return "bu paraya sakız bile vermezler, biriktirmeye devam";
        cheaperItems.sort((a, b) => b.price - a.price);

        let topItems = cheaperItems.slice(0, 3);
        let selectedItem = topItems[Math.floor(Math.random() * topItems.length)];
        let count = Math.floor(amount / selectedItem.price);

        if (count === 1) {
            return `${selectedItem.name} ${selectedItem.action}`;
        } else {
            return `tam ${count} adet ${selectedItem.name} ${selectedItem.action}`;
        }
    }
}

// --- KULLANICI İŞLEMLERİ VE TABLO/GRAFİK ---
async function fetchAndRenderData() {
    const q = query(collection(db, "expenses"), where("uid", "==", auth.currentUser.uid));
    const snapshot = await getDocs(q);
    globalExpenses = [];
    snapshot.forEach(doc => globalExpenses.push({ id: doc.id, ...doc.data() }));
    globalExpenses.sort((a, b) => (b.createdAt?.toMillis() || Date.now()) - (a.createdAt?.toMillis() || Date.now()));
    renderTable(); updateChartData();
}

function renderTable() {
    const filterValue = document.getElementById('history-filter').value;
    const tbody = document.getElementById('history-body');
    tbody.innerHTML = '';

    const getCatName = (id) => {
        const c = appConfig.categories.find(x => x.id === id);
        return c ? c.name : id;
    };

    globalExpenses.forEach(exp => {
        if (filterValue !== 'all' && exp.category !== filterValue) return;
        const dateStr = exp.createdAt ? new Date(exp.createdAt.toMillis()).toLocaleDateString('tr-TR') : 'Şimdi';
        
        tbody.innerHTML += `
            <tr>
                <td>${dateStr}</td>
                <td><span class="badge">${getCatName(exp.category)}</span></td>
                <td>${exp.detail}</td>
                <td class="amt-text">${exp.amount.toLocaleString('tr-TR')} ₺</td>
                <td>
                    <button class="icon-btn edit-btn" onclick="openEditModal('${exp.id}', '${exp.detail}', ${exp.amount})"><i class="fa-solid fa-pen"></i></button>
                    <button class="icon-btn del-btn" onclick="deleteExpense('${exp.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}
document.getElementById('history-filter').addEventListener('change', renderTable);

function initChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    if (expenseChart) expenseChart.destroy();
    expenseChart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Harcama (₺)', data: [], backgroundColor: 'rgba(0, 255, 136, 0.2)', borderColor: '#00ff88', borderWidth: 2, tension: 0.4, fill: true }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#fff' } } }, scales: { y: { beginAtZero: true, grid: { color: '#333' }, ticks: { color: '#8b949e' } }, x: { grid: { color: '#333' }, ticks: { color: '#8b949e' } } } }
    });
}

function updateChartData() {
    let labels = []; 
    let dataObj = {}; 
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    let start = new Date();
    let end = new Date(now);
    let periodTitle = "";

    if(currentChartFilter === 'daily') {
        start.setHours(0, 0, 0, 0);
        periodTitle = "(Bugün)";
        for(let i=0; i<24; i++) { labels.push(`${i}:00`); dataObj[`${i}:00`] = 0; }
    } 
    else if(currentChartFilter === 'weekly') {
        start.setDate(start.getDate() - 6);
        start.setHours(0,0,0,0);
        periodTitle = "(Son 7 Gün)";
        for(let i=6; i>=0; i--) {
            let d = new Date(); d.setDate(d.getDate() - i);
            let dateStr = d.toLocaleDateString('tr-TR', {day: 'numeric', month: 'short'});
            labels.push(dateStr); dataObj[dateStr] = 0;
        }
    }
    else if(currentChartFilter === 'monthly') {
        start.setDate(start.getDate() - 29);
        start.setHours(0,0,0,0);
        periodTitle = "(Son 30 Gün)";
        for(let i=29; i>=0; i--) {
            let d = new Date(); d.setDate(d.getDate() - i);
            let dateStr = d.toLocaleDateString('tr-TR', {day: 'numeric', month: 'short'});
            labels.push(dateStr); dataObj[dateStr] = 0;
        }
    }
    else if(currentChartFilter === 'custom') {
        const sVal = document.getElementById('start-date').value;
        const eVal = document.getElementById('end-date').value;
        if(!sVal || !eVal) return; 
        start = new Date(sVal); start.setHours(0,0,0,0);
        end = new Date(eVal); end.setHours(23,59,59,999);
        periodTitle = `(${start.toLocaleDateString('tr-TR')} - ${end.toLocaleDateString('tr-TR')})`;
        for(let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            let dateStr = d.toLocaleDateString('tr-TR', {day: 'numeric', month: 'short'});
            labels.push(dateStr); dataObj[dateStr] = 0;
        }
    }

    document.getElementById('summary-period').innerText = periodTitle;

    let filteredExps = globalExpenses.filter(exp => {
        const expDate = exp.createdAt ? new Date(exp.createdAt.toMillis()) : new Date();
        return expDate >= start && expDate <= end;
    });

    filteredExps.forEach(exp => {
        const expDate = exp.createdAt ? new Date(exp.createdAt.toMillis()) : new Date();
        if(currentChartFilter === 'daily') {
            dataObj[`${expDate.getHours()}:00`] += exp.amount;
        } else {
            let dateStr = expDate.toLocaleDateString('tr-TR', {day: 'numeric', month: 'short'});
            if(dataObj[dateStr] !== undefined) dataObj[dateStr] += exp.amount;
        }
    });

    expenseChart.data.labels = labels;
    expenseChart.data.datasets[0].data = labels.map(label => dataObj[label]);
    expenseChart.update();

    renderSummary(filteredExps);
}

function renderSummary(expenses) {
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    document.getElementById('summary-total-amount').innerText = `${totalAmount.toLocaleString('tr-TR')} ₺`;

    const catTotals = {};
    expenses.forEach(exp => {
        if(!catTotals[exp.category]) catTotals[exp.category] = 0;
        catTotals[exp.category] += exp.amount;
    });

    const catContainer = document.getElementById('summary-categories');
    catContainer.innerHTML = '';

    if(Object.keys(catTotals).length === 0) {
        catContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Bu dönemde hiç harcama yok aga, kralsın.</p>';
        return;
    }

    const sortedCats = Object.entries(catTotals).sort((a,b) => b[1] - a[1]);
    const getCatName = (id) => {
        const c = appConfig.categories.find(x => x.id === id);
        return c ? c.name : id;
    };

    sortedCats.forEach(([catId, amount]) => {
        catContainer.innerHTML += `
            <div class="summary-cat-item">
                <span>${getCatName(catId)}</span>
                <strong>${amount.toLocaleString('tr-TR')} ₺</strong>
            </div>
        `;
    });
}

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentChartFilter = e.target.getAttribute('data-range');
        const customContainer = document.getElementById('custom-date-container');
        if(currentChartFilter === 'custom') customContainer.classList.remove('hidden');
        else { customContainer.classList.add('hidden'); updateChartData(); }
    });
});
document.getElementById('btn-custom-filter').addEventListener('click', () => {
    if(!document.getElementById('start-date').value || !document.getElementById('end-date').value) return alert("Başlangıç ve Bitiş seç aga!");
    updateChartData();
});

// EKLE
document.getElementById('btn-add-expense').addEventListener('click', async () => {
    const category = document.getElementById('category').value;
    const detail = document.getElementById('detail').value;
    const amount = parseFloat(document.getElementById('amount').value);

    if(!category || !detail || isNaN(amount) || amount <= 0) return alert("Boş bırakma veya sıfır girme aga!");

    let funnyText = `Kanka bu parayla gidip ${getFunnyText(amount)}, sen gittin neye verdin!`;
    document.getElementById('result-title').innerText = `${detail} (${amount.toLocaleString('tr-TR')}₺)`;
    document.getElementById('result-funny').innerText = funnyText;
    document.getElementById('result-box').classList.remove('hidden');

    try {
        await addDoc(collection(db, "expenses"), { uid: auth.currentUser.uid, category, detail, amount, createdAt: serverTimestamp() });
        document.getElementById('detail').value = ''; document.getElementById('amount').value = '';
        fetchAndRenderData();
    } catch (error) { console.error("Hata:", error); }
});

// SİL
window.deleteExpense = async (id) => {
    if(confirm("Kanka bu harcamayı harbiden sileyim mi?")) {
        await deleteDoc(doc(db, "expenses", id));
        fetchAndRenderData();
    }
};

// DÜZENLEME
window.openEditModal = (id, detail, amount) => {
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-detail').value = detail;
    document.getElementById('edit-amount').value = amount;
    document.getElementById('edit-modal').classList.remove('hidden');
};
document.getElementById('btn-cancel-edit').addEventListener('click', () => { document.getElementById('edit-modal').classList.add('hidden'); });
document.getElementById('btn-save-edit').addEventListener('click', async () => {
    const id = document.getElementById('edit-id').value;
    const detail = document.getElementById('edit-detail').value;
    const amount = parseFloat(document.getElementById('edit-amount').value);
    if(!detail || isNaN(amount) || amount <= 0) return alert("Boş geçme aga!");
    await updateDoc(doc(db, "expenses", id), { detail: detail, amount: amount });
    document.getElementById('edit-modal').classList.add('hidden');
    fetchAndRenderData();
});

// --- PWA KURULUMU ---
if ("serviceWorker" in navigator) {
    window.addEventListener("load", function() {
        navigator.serviceWorker.register("/sw.js").then(res => {
            console.log("PWA Motoru aktif aga! Uygulama kurulmaya hazır.");
        }).catch(err => {
            console.log("PWA Motoru patladı:", err);
        });
    });
}