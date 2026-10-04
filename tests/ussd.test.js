const { USSDNode, USSD } = require("../src/ussd.js");
const util = require("util");
const EventEmitter = require("events");
const inspect = (obj) => util.inspect(obj, false, null, true);

const navigation = {
    back: new USSDNode(["0", "Kembali"]),
    next: new USSDNode(["97", "Next"]),
    prev: new USSDNode(["96", "Previous"]),
    quit: new USSDNode(["98", "Quit"], (req, res) => res.send("thankyou for using this service")),
};

// *808#
const node = new USSDNode("808", (req, res) => res.send("Pulsa 7195 aktif s.d 130ct26"));
node.add(new USSDNode(["1", "140GB 28D 369rb"]));
node.add(new USSDNode(["2", "VIP 140GB 30D 379rb"]));
node.add(new USSDNode(["3", "Opt Lain 500mnt 140rb"]));
node.add(new USSDNode(["4", "Kuota Bulanan"]));
node.add(new USSDNode(["5", "Paket Harian"]));
node.add(new USSDNode(["6", "Nelp, Roam&VAS"]));
const node2 = node.add(new USSDNode(["7", "INFO"]));

const node3 = node2.add(new USSDNode(["1", "Info Kartu XL-ku"]));
const node5 = node2.add(new USSDNode(["2", "m-Pulsa"]));
node2.add(new USSDNode(["3", "Cek Kuota & Info Paket"]));
node2.add(new USSDNode(["4", "Program XL"]));
node2.add(new USSDNode(["5", "Kontrol Pulsa"]));
node2.add(navigation.back);

node3.add(new USSDNode(["1", "Cek Kuota"]));
const node4 = node3.add(new USSDNode(["2", "Detail Nomor XL Anda"], (req, res) => res.send("Info Transaksi\nAnda berada di tarif SUPER NGOBROL BARU. Nikmati GRATIS Nelp & SMS TANPA BATAS ke SEMUA XL & AXIS. Info tarif www.xl.co.id/sp")));
node3.add(new USSDNode(["3", "Stop Langganan"]));
node3.add(new USSDNode(["4", "Layanan Internasional"]));
node3.add(new USSDNode(["5", "Info Transaksi"]));
node3.add(new USSDNode(["6", "Info Paket"]));
node3.add(new USSDNode(["7", "Perpanjang Masa Aktif"]));
node3.add(new USSDNode(["8", "Cek Notifikasi"]));
node3.add(navigation.back);

node4.add(new USSDNode(["1", "Cek Profile"]));
node4.add(new USSDNode(["2", "Cek Layanan"]));

node5.add(new USSDNode(["1", "Kartu Kredit/Debit"]));
const node6 = node5.add(new USSDNode(["2", "Bagi Pulsa"], (req, res) => res.send("Butuh pulsa saat ini juga? Tersedia layanan Minta Pulsa ke XL Isg aja pilih 5 Minta Pulsa ke XL/Axis:")));
node5.add(new USSDNode(["3", "mBanking"]));
node5.add(navigation.back);

node6.add(new USSDNode(["1", "Info"]));
node6.add(new USSDNode(["2", "Favorit"]));
node6.add(new USSDNode(["3", "Jadwal"]));
node6
    .add(new USSDNode(["4", "Bagi Pulsa"], (req, res) => res.send("Anda hendak melakukan Bagi Pulsa.\nSilahkan masukkan no tujuan")))
    .add(new USSDNode(":tujuan", (req, res) => res.send("Anda akan Bagi Pulsa ke 087758437457.\nSilahkan masukkan nominal dari min.1 & max.1000000")))
    .add(new USSDNode(":nominal", (req,res) => res.end('Permintaan anda sedang diproses. Terima kasih.')));
node6
    .add(new USSDNode(["5", "Minta Pulsa"], (req, res) => res.send("Silahkan masukkan pilihan Minta pulsa\nAnda:")))
    .add(new USSDNode(["1", "Ke keluarga atau teman Anda"], (req, res) => res.send("Anda hendak minta pulsa. Silahkan masukkan no tujuan")))
    .add(new USSDNode(":tujuan", (req, res) => res.send("Silakan masukkan nominal pulsa yang diminta dari min. 1 & max 1000000")))
    .add(new USSDNode(":nominal", (req,res) => res.end('Permintaan anda sedang diproses. Terima kasih.')));

// *555#
const node7 = new USSDNode("555", (req, res) => res.send("Service not Available."));

// *123#
const node8 = new USSDNode("123", (req, res) => res.send("Akses *123# beralih ke *808#"));

// *999#
const node9 = new USSDNode("*", (req, res) => res.send("Masalah sambungan atau kode MMI tidak valid."));

const routes = [node, node7, node8, node9];
// console.log(inspect(routes));

describe("ussd", () => {
    test("session1", () => {
        const event = new EventEmitter();
        event.on("response", (body) => console.log(body + "\n"));
        event.send = (...args) => event.emit("response", ...args);

        const ussd = new USSD(routes, { event, navigation });

        ussd.request("123");
    });
    test("session2", () => {
        const event = new EventEmitter();
        event.on("response", (body) => console.log(body + "\n"));
        event.send = (...args) => event.emit("response", ...args);

        const ussd = new USSD(routes, { event, navigation });

        ussd.request("789");
    });
    test("session3", () => {
        const event = new EventEmitter();
        event.on("response", (body) => console.log(body + "\n"));
        event.send = (...args) => event.emit("response", ...args);

        const ussd = new USSD(routes, { event, navigation });

        ussd.request("808");
        ussd.request("7");
        ussd.request("2");
        ussd.request("2");
        ussd.request("5");
        ussd.request("1");
        ussd.request("087758437457");
        ussd.request("5000");
    });
    test("session4", () => {
        const event = new EventEmitter();
        event.on("response", (body) => console.log(body + "\n"));
        event.send = (...args) => event.emit("response", ...args);

        const ussd = new USSD(routes, { event, navigation });

        ussd.request("808");
        ussd.request("7");
        ussd.request("1");
        ussd.request("2");
        ussd.request("97");
        ussd.request("97");
        ussd.request("96");
        ussd.request("96");
        ussd.request("97");
        ussd.request("97");
        ussd.request("96");
        ussd.request("96");
        ussd.request("97");
        ussd.request("97");
        ussd.request("98");
        ussd.request("98");
    });
    test.skip("session5", () => {
        const event = new EventEmitter();
        event.on("response", (body) => console.log(body + "\n"));
        event.send = (...args) => event.emit("response", ...args);

        const ussd = new USSD(routes, { event, navigation });

        ussd.request("808");
        ussd.request("7");
        ussd.request("1");
        ussd.request("2");
        ussd.request("97");
        ussd.request("97");
        ussd.request("96");
        ussd.request("96");
        ussd.request("96");
        ussd.request("96");
        ussd.request("96");
        ussd.request("98");
    });
    test.skip("session6", () => {
        const event = new EventEmitter();
        event.on("response", (body) => console.log(body + "\n"));
        event.send = (...args) => event.emit("response", ...args);

        const ussd = new USSD(routes, { event, navigation });

        ussd.request("808");//start
        ussd.request("7");
        ussd.request("2");
        ussd.request("2");
        ussd.request("5");
        ussd.request("1");
        ussd.request("087758437457");
        ussd.request("5000");//end
        ussd.request("808");//start
    });
});
