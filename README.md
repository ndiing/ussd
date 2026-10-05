# @ndiinginc/ussd

Library Node.js untuk membangun menu **USSD** berbasis pohon (tree) dengan routing ala URL, parameter dinamis, tombol kembali, pagination otomatis untuk pesan panjang, dan timeout sesi.

## Fitur

- Menu bertingkat dengan `USSDNode` (parent → children)
- Routing berbasis [`URLPattern`](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern), mendukung parameter dinamis (`:nominal`) dan wildcard (`*`)
- `res.send()`, `res.back()`, `res.end()` yang familiar
- Pagination otomatis jika pesan melebihi `messageLength` (Next / Previous / Quit)
- Timeout sesi dengan handler sendiri
- Mendukung dua mode input: satu langkah per request (`"7"`) atau string USSD penuh (`"*808*7*1#"`)
- Event `response` untuk mengirim output ke gateway/provider apa pun

## Persyaratan

- Node.js **23.8+** (memakai global `URLPattern` dan `Array.prototype.toSorted`)
- CommonJS (`require`)

## Instalasi

```bash
npm install @ndiinginc/ussd
```

## Quick Start

```js
const { USSD, USSDNode } = require("@ndiinginc/ussd");

// Node navigasi (dipakai untuk pagination)
const navigation = {
    next: new USSDNode(["97", "Next"]),
    prev: new USSDNode(["96", "Previous"], (req, res) => res.back()),
    quit: new USSDNode(["98", "Quit"], (req, res) => res.end("Terima kasih.")),
};

// Dipanggil saat sesi timeout
const timeout = new USSDNode("*", (req, res) => res.end("Sesi berakhir."));

// *808#
const root = new USSDNode("808", (req, res) => res.send("Selamat datang"));
root.add(new USSDNode(["1", "Cek Pulsa"], (req, res) => res.end("Pulsa Anda Rp10.000")));

const info = root.add(new USSDNode(["2", "Info"]));
info.add(new USSDNode(["0", "Kembali"], (req, res) => res.back()));

// Satu instance USSD = satu sesi pengguna
const ussd = new USSD([root], { navigation, timeout });

ussd.on("response", (text) => console.log(text));

ussd.request("*808#");
ussd.request("1");
```

Output:

```
Selamat datang
1 Cek Pulsa
2 Info
```

> **Penting:** `USSD` menyimpan state sesi (riwayat input, route aktif, timer). Buat **satu instance per sesi/MSISDN**, jangan dibagi antar pengguna.

## Konsep

### Routing

Setiap `USSDNode` punya `pattern` yang dicocokkan terhadap input pada levelnya. Input diproses berurutan dari root: `*808*7*1#` → `808` → `7` → `1`.

| Pattern    | Cocok dengan                          |
| ---------- | ------------------------------------- |
| `"808"`    | input persis `808`                    |
| `"1"`      | input persis `1`                      |
| `":nomor"` | input apa saja, disimpan di `req.params.nomor` |
| `"*"`      | wildcard, cocok dengan semua input    |

Route dicocokkan sesuai urutan `add()`/array, jadi letakkan wildcard (`*`) **paling akhir** sebagai fallback.

Jika input tidak cocok dengan route mana pun di level aktif, input tersebut dibuang dan pengguna tetap di menu saat ini.

### Menu

Node yang punya **label** otomatis tampil sebagai item menu di parent-nya. Format: `"<value> <label>"`.

Urutan default: ascending berdasarkan angka, dengan `0` selalu paling bawah (cocok untuk tombol "Kembali"). Ubah dengan `menuCompareFn`.

### Parameter dinamis

```js
node6
    .add(new USSDNode(["4", "Bagi Pulsa"], (req, res) => res.send("Masukkan no tujuan")))
    .add(new USSDNode(":tujuan", (req, res) => res.send(`Tujuan ${req.params.tujuan}. Masukkan nominal`)))
    .add(
        new USSDNode(":nominal", (req, res) => {
            const { tujuan, nominal } = req.params;
            res.end(`Bagi pulsa ${nominal} ke ${tujuan} diproses.`);
        }),
    );
```

### Pagination

Jika pesan di `res.send()` lebih panjang dari `messageLength` (default `120` karakter), pesan dipecah per kata menjadi beberapa halaman. Library otomatis menambahkan menu `Next`, `Previous`, dan `Quit` dari objek `navigation`, lalu menyambungkan kembali children asli node di halaman terakhir.

### Timeout

Setiap request me-reset timer. Jika tidak ada request selama `timeoutMs` (default `60_000`), handler node `timeout` dijalankan.

## API

### `new USSDNode(pattern, handler?)`

| Parameter | Tipe | Keterangan |
| --- | --- | --- |
| `pattern` | `string \| [value, label]` | Pattern `URLPattern`. Pakai array `[value, label]` agar tampil di menu. |
| `handler` | `(req, res) => void \| Promise<void>` | Dipanggil saat node aktif. Default: `res.send()` (menampilkan message/menu node). |

Method:

- `add(child)` → menambahkan child dan mengembalikan child tersebut (bisa di-chain)
- `getMenu(compareFn?)` → string menu dari children yang punya label
- `setMessage(message)` → set pesan statis node

### `new USSD(routes, options?)`

| Option | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `navigation` | `{ next, prev, quit }` | - | Node untuk pagination. Wajib jika pesan bisa melebihi `messageLength`. |
| `messageLength` | `number` | `120` | Panjang maksimum karakter per halaman |
| `menuCompareFn` | `(a, b) => number` | angka asc, `0` terakhir | Pengurutan menu |
| `timeout` | `USSDNode` | - | Node yang dijalankan saat timeout |
| `timeoutMs` | `number` | `60000` | Durasi timeout (ms) |

Method & event:

- `await ussd.request(input)`: memproses input pengguna
    - `"*808*7*1#"` → string USSD penuh, riwayat input **diganti**
    - `"7"` → satu langkah, **ditambahkan** ke riwayat
- `ussd.on("response", (text) => {})`: dipanggil setiap ada output untuk pengguna

### `res`

| Method | Keterangan |
| --- | --- |
| `res.send(message?)` | Kirim pesan + menu node saat ini. Sesi tetap berlanjut. |
| `res.back()` | Kembali satu level, lalu render ulang menu sebelumnya. |
| `res.end(message?)` | Kirim pesan terakhir, tutup sesi, dan reset state. |

### `req`

| Properti | Keterangan |
| --- | --- |
| `req.params` | Parameter dinamis hasil pencocokan pattern (`:nama`) |

## Menjalankan Test

```bash
npm test
```

## Catatan

- Pada string USSD penuh (`*808*7*1*2*98#`), seluruh langkah diproses sekaligus. Menu dinamis seperti Next/Previous/Quit hasil pagination tidak tersedia di jalur ini, sama seperti perilaku USSD asli.
- Handler bertipe `string` (message statis) hanya aman dipakai pada node yang dibuat setelah instance `USSD` dibuat. Untuk route utama, gunakan handler fungsi.
