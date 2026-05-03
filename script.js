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
let appConfig = {}; // Tük kategori ve yüzleşme metinleri burada tutulacak

// --- SİSTEM AYARLARINI (KATEGORİLER VE YÜZLEŞMELER) ÇEK ---
async function loadAppConfig() {
    const docRef = doc(db, "settings", "app_config");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        appConfig = docSnap.data();
    } else {
        // Eğer veritabanında henüz ayar yoksa, senin yazdığın listeyi varsayılan olarak kaydet
        appConfig = {
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
            funnyTexts: [
                { max: 100, items: ["4 tane 0.5L şişe su alabilirdin", "1 tane Magnum alabilirdin", "1 tane pizza tadında simit alabilirdin", "1 porsiyon etsiz çiğ köfte dürüm yiyebilirdin", "BİM'den 2 paket büyük boy cips alabilirdin"] },
                { max: 200, items: ["1 tane tavuk dürüm menü alabilirdin", "İzmit-Arifiye arası TCDD Genç bileti alabilirdin", "ortalama bir kafede 1 bardak filtre kahve içebilirdin", "50cc scooter için 1-2 litre benzin alabilirdin", "1 aylık Netflix temel plan ödeyebilirdin"] },
                { max: 300, items: ["Steam'den indirimli güzel bir oyun alabilirdin", "scooter için yeni bir buji alabilirdin", "1 kişilik sinema bileti alabilirdin", "1 aylık Spotify Premium ödeyebilirdin", "Komagene'den 1 porsiyon etsiz çiğ köfte porsiyon alabilirdin"] },
                { max: 500, items: ["Clash of Clans'tan 'Taş Yığını' paketi alabilirdin", "İzmit-Arifiye arası şehirlerarası otobüs bileti alabilirdin", "1 aylık Adobe Creative Cloud öğrenci aboneliği ödeyebilirdin", "Packet burgerde sınırsız içicekli bir hamburger menü yiyebilirdin", "Gariban bir mouse alabilirdin"] },
                { max: 1000, items: ["Vercel veya Firebase için aylık ekstra kullanım ücreti/domain yenilemesi ödeyebilirdin", "Steam'den Hearts of Iron IV veya GTA V'i indirimsiz alabilirdin", "eve 3'lü banyo rafı seti alabilirdin", "indirimden ortalama bir spor ayakkabı tabanı alabilirdin", "Damar tıkama garantili bir akşam yemeği yiyebilirdin"] },
                { max: 1500, items: ["nevresim takımı alabilirdin", "odaya ayaklı vantilatör alabilirdin", "A2 seviye Almanca çalışma seti ve kitapları alabilirdin", "giriş seviyesi mekanik baş ağrıtan oyuncu klavyesi alabilirdin", "dandik bir akıllı saat alabilirdin"] },
                { max: 3000, items: ["Motorunun deposunu fulleyebilirdin", "giriş seviyesi bir monitör alabilirdin", "ortalama bir Airfryer alabilirdin", "100 tane torpil alıp patlatabilirdin", "1 yıllık Office 365 lisansı alabilirdin"] },
                { max: 5000, items: ["Kripto borsasında 100 dolarlık ufak bir long/short marjin kasası yapabilirdin", "Orta halli 2-3 tane akıllı telefon kılıfı alabilirdin", "PlayStation 5 için 2 adet yeni nesil oyun alabilirdin", "ortalama bir motosiklet montu alabilirdin", "giriş-orta seviye bir robot süpürge alabilirdin"] },
                { max: 10000, items: ["Bükreş'e gidiş-dönüş uçak bileti alabilirdin", "orta segment bir tablet alabilirdin", "Bisiklet alabilirdin", "gram altın alabilirdin", "ev için orta kalite bir televizyon alabilirdin"] },
                { max: 20000, items: ["Xbox 360 veya PS4 alabilirdin", "iş görecek orta halli bir laptop alabilirdin", "Xiaomi telefon alabilirdin", "odaya klima taktırabilirdin", "Nikon D3200 18-55 mm Kit Fotoğraf Makinesi alabilirdin"] },
                { max: 50000, items: ["İkinci el temiz 50cc Cappucino tarzı bir scooter alabilirdin", "orta düzey bir oyuncu bilgisayarı dizebilirdin", "amiral gemisi bir akıllı telefon (iPhone 15/16) alabilirdin", "kaliteli bir tatil köyünde ortalama bir tatil yapabilirdin", "bedelli askerlik ücretinin 1/10 kısmını denkleştirebilirdin"] },
                { max: 100000, items: ["bedelli askerlik ücretinin yaklaşık 1/7 kısmını yatırabilirdin", "ikinci el 125cc temiz bir motosiklet alabilirdin", "MacBook Pro 14 inc M3 1TB Gümüş alabilirdin", "Balkan turuna çıkabilirdin", "yeni ev kiralarken peşinat+depozito+emlakçı masrafını tek kalemde ödeyebilirdin"] },
                { max: 200000, items: ["CFMoto CLX250 tarzı uygun fiyata sıfıra yakın bir motosiklet alabilirdin", "ayağını yerden kesecek çok eski model bir araba (Tofaş/Brodway) alabilirdin", "küçük çaplı bir e-ticaret işi kurmak için sermaye yapabilirdin", "Rado Captain Cook Automatic Erkek Kol Saati alabilirdin", "evin banyo ve mutfağını baştan aşağı tadilata sokabilirdin"] },
                { max: 500000, items: ["2010 model altı orta halli ikinci el bir araba alabilirdin", "600cc ve üzeri büyük hacimli motosiklet alabilirdin", "şehir dışında yatırımlık ufak bir arsa alabilirdin", "1 yıllık yurt dışı dil okulu masrafını karşılayabilirdin"] },
                { max: 1000000, items: ["2015-2020 arası B veya C segment ikinci el bir araba alabilirdin", "Anadolu'nun daha küçük şehirlerinde 1+0 apart daire alabilirdin", "tatillere gitmek için orta bir karavan alabilirdin", "borsada veya kriptoda sağlam bir yatırım portföyü kurabilirdin"] },
                { max: 3000000, items: ["İzmit gibi büyükşehirlerde ortalama bir 2+1 ev alabilirdin", "sıfır kilometre C-SUV segmentinde bir araç alabilirdin", "lüks segment ikinci el bir araç (BMW, Mercedes) alabilirdin", "orta ölçekli bir bilindik marka franchise bayiliği açabilirdin"] },
                { max: 5000000, items: ["küçük şehirlerde lüks bir daire veya site içi ev alabilirdin", "premium sınıf 2.el bir araç (Porsche Macan, Audi Q7 vb.) alabilirdin", "Marmara bölgesinde tarıma ve yatırıma uygun büyük bir tarla alabilirdin", "giriş seviyesi tekne alabilirdin", "Balkanlar'da yatırım ve kira amaçlı bir ev alabilirdin"] },
                { max: 99999999, items: ["İstanbul'da iyi bir semtte geniş ve lüks bir ev alabilirdin", "üst düzey lüks spor araba (Porsche 911, Maserati vb.) alabilirdin", "Bodrum veya Çeşme'de güzel bir yazlık villa alabilirdin", "fabrika veya atölye kurmak için orta ölçekli sanayi yatırımı yapabilirdin", "aylık ciddi pasif kira getirisi sağlayacak merkezi bir ticari dükkan alabilirdin"] }
            ]
        };
        await setDoc(docRef, appConfig);
    }
    populateUI();
}

function populateUI() {
    // 1. Kategorileri UI'a bas
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
        await loadAppConfig(); // Sistemi ayağa kaldır
        
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
    populateUI(); // Geri dönerken değişiklikleri ana ekrana yansıt
});

// 1. Son Kayıt Olan Kullanıcılar (Sadece Admin görür)
async function loadAdminUsers() {
    const tbody = document.getElementById('admin-users-body');
    tbody.innerHTML = '<tr><td colspan="3">Yükleniyor...</td></tr>';
    // Kullanıcıları kayıt tarihine göre sırala (En son kayıt olan en üstte)
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

// 2. Ayarları Yükle (Admin Ekranına)
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

    // Yüzleşme Metinlerini Bas
    const funnyList = document.getElementById('admin-funny-list');
    funnyList.innerHTML = '';
    appConfig.funnyTexts.forEach((item, index) => {
        const textStr = item.items.join('\n'); // Alt alta görünsün diye
        funnyList.innerHTML += `
            <div class="funny-card">
                <label>Max: <input type="number" id="f-max-${index}" value="${item.max}" style="width:100px; padding:5px; margin-bottom:0; display:inline-block;"></label>
                <textarea id="f-text-${index}" placeholder="Esprileri alt alta yaz...">${textStr}</textarea>
            </div>
        `;
    });
}

// Kategori Ekle/Sil
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

// Yüzleşme Metinlerini Kaydet
document.getElementById('btn-save-funny-texts').addEventListener('click', async () => {
    appConfig.funnyTexts.forEach((item, index) => {
        item.max = parseFloat(document.getElementById(`f-max-${index}`).value);
        // Textarea'daki her satırı diziye çevirip boş olanları atıyoruz
        const rawTexts = document.getElementById(`f-text-${index}`).value;
        item.items = rawTexts.split('\n').map(t => t.trim()).filter(t => t !== "");
    });
    // Max tutara göre küçükten büyüğe sırala ki algoritma düzgün çalışsın
    appConfig.funnyTexts.sort((a,b) => a.max - b.max);
    await saveSettingsToDB();
    alert("Yüzleşme metinleri başarıyla güncellendi kanka!");
    loadAdminSettings();
});

async function saveSettingsToDB() {
    await setDoc(doc(db, "settings", "app_config"), appConfig);
}

// --- DİNAMİK YÜZLEŞME MOTORU (Veritabanından Okur) ---
function getFunnyText(amount) {
    const getRnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
    
    for (let i = 0; i < appConfig.funnyTexts.length; i++) {
        if (amount <= appConfig.funnyTexts[i].max) {
            return getRnd(appConfig.funnyTexts[i].items);
        }
    }
    // Eğer girilen rakam en büyükten bile büyükse en sondakini ver
    return getRnd(appConfig.funnyTexts[appConfig.funnyTexts.length - 1].items);
}


// --- KULLANICI İŞLEMLERİ VE TABLO/GRAFİK (Öncekiyle aynı) ---
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

    // Kategorilerin isimlerini bulmak için helper
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