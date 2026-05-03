import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
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
                { name: "torpil", price: 20, action: "patlatabilirdin" },
                { name: "kurşun kalem", price: 25, action: "alabilirdin" },
                { name: "albeni bisküvi", price: 40, action: "alabilirdin" },
                { name: "cips", price: 50, action: "alabilirdin" },
                { name: "pizza tadında simit", price: 85, action: "alabilirdin" },
                { name: "magnum dondurma", price: 95, action: "alabilirdin" },
                { name: "bardak", price: 100, action: "alabilirdin" },
                { name: "çiğköfte dürüm", price: 110, action: "yiyebilirdin" },
                { name: "lahmacun", price: 125, action: "yiyebilirdin" },
                { name: "defter", price: 150, action: "alabilirdin" },
                { name: "komagene double dürüm + ayran", price: 150, action: "yiyebilirdin" },
                { name: "clash of clans taş yığını paketi", price: 199, action: "alabilirdin" },
                { name: "havlu", price: 250, action: "alabilirdin" },
                { name: "terlik", price: 250, action: "alabilirdin" },
                { name: "packet burger sınırsız içecek menü", price: 285, action: "yiyebilirdin" },
                { name: "pastanede tek kişilik pasta", price: 299, action: "yiyebilirdin" },
                { name: "kfc doyuran menü", price: 300, action: "yiyebilirdin" },
                { name: "adana dürüm", price: 350, action: "yiyebilirdin" },
                { name: "çöp kutusu", price: 450, action: "alabilirdin" },
                { name: "gariban mouse", price: 500, action: "alabilirdin" },
                { name: "dominos xl pizza", price: 599, action: "yiyebilirdin" },
                { name: "laptop soğutucu", price: 650, action: "alabilirdin" },
                { name: "mousepad", price: 750, action: "alabilirdin" },
                { name: "eşofman", price: 999, action: "alabilirdin" },
                { name: "gta 5", price: 1200, action: "alabilirdin" },
                { name: "nevresim takımı", price: 1250, action: "alabilirdin" },
                { name: "sakarya aquapark giriş bileti", price: 1500, action: "alabilirdin" },
                { name: "motorunun deposunu fulleme", price: 1500, action: "yapabilirdin" },
                { name: "logitech mouse", price: 1700, action: "alabilirdin" },
                { name: "nike çanta", price: 2000, action: "alabilirdin" },
                { name: "hamam masaj jakuzi", price: 2500, action: "yapabilirdin" },
                { name: "giriş seviyesi monitör", price: 3000, action: "alabilirdin" },
                { name: "ortalama bir airfryer", price: 3200, action: "alabilirdin" },
                { name: "1 yıllık microsoft office aboneliği", price: 3250, action: "alabilirdin" },
                { name: "bodrumda tatil", price: 12000, action: "yapabilirdin" },
                { name: "apple watch se 3 gps alüminyum kasa", price: 13000, action: "alabilirdin" },
                { name: "lenovo loq 5060", price: 48000, action: "alabilirdin" },
                { name: "iyi bir oyuncu kasası", price: 55000, action: "toplayabilirdin" },
                { name: "sıfır arora cappucinino 50cc motor", price: 72500, action: "alabilirdin" },
                { name: "iphone 17", price: 75000, action: "alabilirdin" },
                { name: "tofaş", price: 118695, action: "alabilirdin" },
                { name: "kriptoya ortalama bir bakiye ile giriş", price: 150000, action: "yapabilirdin" },
                { name: "ford escort", price: 167000, action: "alabilirdin" },
                { name: "bedelli askerlik", price: 425000, action: "yapabilirdin" },
                { name: "600cc ve üzeri bir motor", price: 485000, action: "alabilirdin" },
                { name: "araba egea", price: 1200000, action: "alabilirdin" },
                { name: "2+1 ev", price: 2500000, action: "alabilirdin" },
                { name: "3+1 ev", price: 3500000, action: "alabilirdin" },
                { name: "giriş seviye bir tekne", price: 3500000, action: "alabilirdin" }
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

// --- AUTH ---
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

// --- YENİ ADMİN PANELİ FONKSİYONLARI ---
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
    // Kategorileri Bas
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

    // Tolerance (Yüzdelik) Ayarını Bas
    const tolInput = document.getElementById('admin-tolerance');
    if(tolInput) tolInput.value = appConfig.tolerance !== undefined ? appConfig.tolerance : 20;

    // Ürünleri Bas
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

// Item Güncellemelerini ve Yüzde Ayarını Kaydet
document.getElementById('btn-save-items').addEventListener('click', async () => {
    // Admin panelinden tolerans yüzdesini çek
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

// --- YENİ ZEKİ SEÇİM MOTORU (% ARALIKLI) ADET OLMADAN ---
function getFunnyText(amount) {
    if (!appConfig.items || appConfig.items.length === 0) return "hesaplayamadım, bir şeyler ters gitti";

    // Panelden gelen yüzdeyi al, yoksa %20 kullan
    let tolerance = appConfig.tolerance !== undefined ? appConfig.tolerance : 20;
    
    // Girdiği paranın % tolerans kadarı aşağısı ve yukarısını hesapla
    let minPrice = amount * (1 - (tolerance / 100));
    let maxPrice = amount * (1 + (tolerance / 100));

    // Bu aralıktaki tüm ürünleri bul
    let affordableItems = appConfig.items.filter(item => item.price >= minPrice && item.price <= maxPrice);

    // Joker Durum: Eğer bu aralıkta hiç ürün yoksa, adamın parasına yeten herhangi bir şeyi bul
    if (affordableItems.length === 0) {
        affordableItems = appConfig.items.filter(item => item.price <= amount);
        if (affordableItems.length === 0) return "bu paraya sakız bile vermezler, biriktirmeye devam";
    }

    // Seçilen havuzdan Tümüyle RASTGELE birini al
    let selectedItem = affordableItems[Math.floor(Math.random() * affordableItems.length)];

    // ADET YAZISINI VE KÜSÜRATLARI SİLDİK. DİREKT İSMİ YAPIŞTIRIYOR
    return `${selectedItem.name} ${selectedItem.action}`;
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
    let labels = []; let dataObj = {}; const now = new Date();
    if(currentChartFilter === 'daily') {
        for(let i=0; i<24; i++) { labels.push(`${i}:00`); dataObj[`${i}:00`] = 0; }
        globalExpenses.forEach(exp => {
            const expDate = exp.createdAt ? new Date(exp.createdAt.toMillis()) : new Date();
            if(expDate.toDateString() === now.toDateString()) dataObj[`${expDate.getHours()}:00`] += exp.amount;
        });
    } 
    else if(currentChartFilter === 'weekly') {
        for(let i=6; i>=0; i--) {
            let d = new Date(); d.setDate(d.getDate() - i);
            let dateStr = d.toLocaleDateString('tr-TR', {day: 'numeric', month: 'short'});
            labels.push(dateStr); dataObj[dateStr] = 0;
        }
        globalExpenses.forEach(exp => {
            const expDate = exp.createdAt ? new Date(exp.createdAt.toMillis()) : new Date();
            let dateStr = expDate.toLocaleDateString('tr-TR', {day: 'numeric', month: 'short'});
            if(dataObj[dateStr] !== undefined) dataObj[dateStr] += exp.amount;
        });
    }
    else if(currentChartFilter === 'monthly') {
        for(let i=29; i>=0; i--) {
            let d = new Date(); d.setDate(d.getDate() - i);
            let dateStr = d.toLocaleDateString('tr-TR', {day: 'numeric', month: 'short'});
            labels.push(dateStr); dataObj[dateStr] = 0;
        }
        globalExpenses.forEach(exp => {
            const expDate = exp.createdAt ? new Date(exp.createdAt.toMillis()) : new Date();
            let dateStr = expDate.toLocaleDateString('tr-TR', {day: 'numeric', month: 'short'});
            if(dataObj[dateStr] !== undefined) dataObj[dateStr] += exp.amount;
        });
    }
    else if(currentChartFilter === 'custom') {
        const start = new Date(document.getElementById('start-date').value);
        const end = new Date(document.getElementById('end-date').value);
        end.setHours(23,59,59);
        for(let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            let dateStr = d.toLocaleDateString('tr-TR', {day: 'numeric', month: 'short'});
            labels.push(dateStr); dataObj[dateStr] = 0;
        }
        globalExpenses.forEach(exp => {
            const expDate = exp.createdAt ? new Date(exp.createdAt.toMillis()) : new Date();
            if(expDate >= start && expDate <= end) {
                let dateStr = expDate.toLocaleDateString('tr-TR', {day: 'numeric', month: 'short'});
                if(dataObj[dateStr] !== undefined) dataObj[dateStr] += exp.amount;
            }
        });
    }
    expenseChart.data.labels = labels;
    expenseChart.data.datasets[0].data = labels.map(label => dataObj[label]);
    expenseChart.update();
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