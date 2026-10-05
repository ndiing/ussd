const { USSDNode, USSD } = require("../src/ussd.js");
const util = require("util");
const EventEmitter = require("events");
const inspect = (obj) => util.inspect(obj, false, null, true);

const back = new USSDNode(["0", "Kembali"], (req, res) => res.back());
const timeout = new USSDNode("*", (req, res) => res.end("error-code1"));

const navigation = {
    next: new USSDNode(["97", "Next"]),
    prev: new USSDNode(["96", "Previous"], (req, res) => res.back()),
    quit: new USSDNode(["98", "Quit"], (req, res) => res.end("thankyou for using this service")),
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
node2.add(back);

node3.add(new USSDNode(["1", "Cek Kuota"]));
const node4 = node3.add(new USSDNode(["2", "Detail Nomor XL Anda"], (req, res) => res.send("Info Transaksi\nAnda berada di tarif SUPER NGOBROL BARU. Nikmati GRATIS Nelp & SMS TANPA BATAS ke SEMUA XL & AXIS. Info tarif www.xl.co.id/sp")));
node3.add(new USSDNode(["3", "Stop Langganan"]));
node3.add(new USSDNode(["4", "Layanan Internasional"]));
node3.add(new USSDNode(["5", "Info Transaksi"]));
node3.add(new USSDNode(["6", "Info Paket"]));
node3.add(new USSDNode(["7", "Perpanjang Masa Aktif"]));
node3.add(new USSDNode(["8", "Cek Notifikasi"]));
node3.add(back);

node4.add(new USSDNode(["1", "Cek Profile"]));
node4.add(new USSDNode(["2", "Cek Layanan"]));

node5.add(new USSDNode(["1", "Kartu Kredit/Debit"]));
const node6 = node5.add(new USSDNode(["2", "Bagi Pulsa"], (req, res) => res.send("Butuh pulsa saat ini juga? Tersedia layanan Minta Pulsa ke XL Isg aja pilih 5 Minta Pulsa ke XL/Axis:")));
node5.add(new USSDNode(["3", "mBanking"]));
node5.add(back);

node6.add(new USSDNode(["1", "Info"]));
node6.add(new USSDNode(["2", "Favorit"]));
node6.add(new USSDNode(["3", "Jadwal"]));
node6
    .add(new USSDNode(["4", "Bagi Pulsa"], (req, res) => res.send("Anda hendak melakukan Bagi Pulsa.\nSilahkan masukkan no tujuan")))
    .add(new USSDNode(":tujuan", (req, res) => res.send("Anda akan Bagi Pulsa ke 087758437457.\nSilahkan masukkan nominal dari min.1 & max.1000000")))
    .add(
        new USSDNode(":nominal", (req, res) => {
            console.log(req);
            res.end("Permintaan anda sedang diproses. Terima kasih.");
        }),
    );
node6
    .add(new USSDNode(["5", "Minta Pulsa"], (req, res) => res.send("Silahkan masukkan pilihan Minta pulsa\nAnda:")))
    .add(new USSDNode(["1", "Ke keluarga atau teman Anda"], (req, res) => res.send("Anda hendak minta pulsa. Silahkan masukkan no tujuan")))
    .add(new USSDNode(":tujuan", (req, res) => res.send("Silakan masukkan nominal pulsa yang diminta dari min. 1 & max 1000000")))
    .add(
        new USSDNode(":nominal", (req, res) => {
            console.log(req);
            res.end("Permintaan anda sedang diproses. Terima kasih.");
        }),
    );

// *555#
const node7 = new USSDNode("555", (req, res) => res.end("Service not Available."));

// *123#
const node8 = new USSDNode("123", (req, res) => res.end("Akses *123# beralih ke *808#"));

// *999#
const node9 = new USSDNode("*", (req, res) => res.end("Masalah sambungan atau kode MMI tidak valid."));

const routes = [node, node7, node8, node9];
// console.log(inspect(routes));

describe("ussd", () => {
    test("call 555", () => {
        const ussd = new USSD(routes, { navigation, timeout });
        ussd.on("response", (response) => console.log(response + "\n"));

        ussd.request("555");
    });
    test("call 999", () => {
        const ussd = new USSD(routes, { navigation, timeout });
        ussd.on("response", (response) => console.log(response + "\n"));

        ussd.request("999");
    });
    test("call 123", () => {
        const ussd = new USSD(routes, { navigation, timeout });
        ussd.on("response", (response) => console.log(response + "\n"));

        ussd.request("123");
    });
    test("call 808 handle back", () => {
        const ussd = new USSD(routes, { navigation, timeout });
        ussd.on("response", (response) => console.log(response + "\n"));

        ussd.request("808");
        ussd.request("7");
        ussd.request("1");
        ussd.request("0");
        ussd.request("0"); // back to 808
        ussd.request("0"); // try another back => valid 808
        ussd.request("0"); // try another back => valid 808
        ussd.request("0"); // try another back => valid 808
    });
    test("call 808 handle paging", () => {
        const ussd = new USSD(routes, { navigation, timeout, messageLength: 60 });
        ussd.on("response", (response) => console.log(response + "\n"));

        ussd.request("808");
        ussd.request("7");
        ussd.request("1");
        ussd.request("2"); // messageLength:60, should be 3 pages, page 1
        ussd.request("97"); // messageLength:60, should be 3 pages, page 2
        ussd.request("97"); // messageLength:60, should be 3 pages, page 3
        ussd.request("96"); // back
        ussd.request("96"); // back => valid 2
        ussd.request("97"); // messageLength:60, should be 3 pages, page 2
        ussd.request("97"); // messageLength:60, should be 3 pages, page 3
        ussd.request("98"); // thankyou for using this service

        ussd.request("808"); // valid
        ussd.request("7");
        ussd.request("1");
        ussd.request("2"); // messageLength:60, should be 3 pages, page 1
        ussd.request("97"); // messageLength:60, should be 3 pages, page 2
        ussd.request("97"); // messageLength:60, should be 3 pages, page 3
        ussd.request("96"); // back
        ussd.request("96"); // back => valid 2
        ussd.request("97"); // messageLength:60, should be 3 pages, page 2
        ussd.request("97"); // messageLength:60, should be 3 pages, page 3
        ussd.request("98"); // thankyou for using this service
    });
    test("call 808 timeout", () => {
        const ussd = new USSD(routes, { navigation, timeout, timeoutMs: 5_000 });
        ussd.on("response", (response) => console.log(response + "\n"));

        ussd.request("808");
    });
    test("call 808 params", () => {
        const ussd = new USSD(routes, { navigation, timeout });
        ussd.on("response", (response) => console.log(response + "\n"));

        ussd.request("808");
        ussd.request("7");
        ussd.request("2");
        ussd.request("2");
        ussd.request("5");
        ussd.request("1");
        ussd.request("081935155404");
        ussd.request("5000");
    });

    test("call 808 handle unknown inputs", () => {
        const ussd = new USSD(routes, { navigation, timeout });
        ussd.on("response", (response) => console.log(response + "\n"));

        ussd.request("808");
        ussd.request("7");
        ussd.request("7");
        ussd.request("7");
        ussd.request("7");
        ussd.request("7");
        ussd.request("7");
        ussd.request("1");
        ussd.request("2");
        ussd.request("97");
        ussd.request("97");
        ussd.request("97");
        ussd.request("97");
        ussd.request("97");
        ussd.request("98");
    });

    test("call 808 input", () => {
        const ussd = new USSD(routes, { navigation, timeout });
        ussd.on("response", (response) => console.log(response + "\n"));

        ussd.request("808"); // USSD UMB
        ussd.request("7"); // USSD UMB
        ussd.request("1"); // USSD UMB
        ussd.request("2"); // USSD UMB
        ussd.request("98"); // USSD UMB

        ussd.request("*808*7*1*2*98#"); // <= real USSD, 98 tidak di proses/segala macam menu dinamis tidak di proses saat USSD Call => valid
        ussd.request("98"); // <= real USSD
    });
});
