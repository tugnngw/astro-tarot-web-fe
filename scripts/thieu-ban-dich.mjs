// Liệt kê những chuỗi tiếng Việt CHƯA dịch sang tiếng Anh.
//
//   node scripts/thieu-ban-dich.mjs          # tóm tắt + 40 chuỗi gặp nhiều nhất
//   node scripts/thieu-ban-dich.mjs --het    # in hết
//   node scripts/thieu-ban-dich.mjs --tep    # gom theo tệp, để biết dịch tệp nào trước
//
// Vì sao cần: từ điển tra theo chính câu tiếng Việt nên chuỗi thiếu KHÔNG gây
// lỗi gì — nó lặng lẽ hiện tiếng Việt giữa trang tiếng Anh. Tiện lúc dịch
// dần, nhưng có nghĩa là mắt thường không soát nổi. Script này là cách duy
// nhất biết còn thiếu bao nhiêu.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const GOC = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const SRC = join(GOC, "src");

const DAU = "àáâãèéêìíòóôõùúýăđĩũơưạảấầẩậắằẵặẹẻẽếềểệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ";
const CO_DAU = new RegExp(`[${DAU}${DAU.toUpperCase()}]`);

/** Những tệp không phải giao diện: bình luận tiếng Việt ở đó không cần dịch. */
const BO_QUA = [
  /\.test\.tsx?$/,
  /[/\\]tu-dien[/\\]/,
  /[/\\]routeTree\.gen\.ts$/,
  /[/\\]scripts[/\\]/,
];

/**
 * Tệp dữ liệu — đếm riêng, KHÔNG gộp vào số "còn phải dịch".
 *
 * Ba tệp này chiếm hơn một phần năm tổng số chuỗi nhưng không phải nhãn giao
 * diện, và dịch bừa thì hỏng:
 *
 *   • emote.ts, banks.ts — chữ tiếng Việt ở đó là TỪ KHOÁ TÌM ("ngân hàng
 *     ngoại thương" gõ ra Vietcombank). Dịch sang tiếng Anh là người dùng
 *     Việt không tìm được nữa.
 *   • tarot-cards.ts — tên và nghĩa 78 lá bài. Đây là nội dung thật, dịch
 *     được và nên dịch, nhưng là việc biên tập chứ không phải gắn nhãn, nên
 *     tính thành hạng mục riêng.
 */
const DU_LIEU = [/[/\\]emote\.ts$/, /[/\\]banks\.ts$/, /[/\\]tarot-cards\.ts$/];

function duyet(thuMuc, ra = []) {
  for (const ten of readdirSync(thuMuc)) {
    const d = join(thuMuc, ten);
    if (statSync(d).isDirectory()) duyet(d, ra);
    else if (/\.tsx?$/.test(d) && !BO_QUA.some((r) => r.test(d))) ra.push(d);
  }
  return ra;
}

/**
 * Bỏ bình luận trước khi dò.
 *
 * Mã nguồn này bình luận bằng tiếng Việt rất nhiều. Không bỏ thì script báo
 * hàng nghìn "chuỗi thiếu" toàn là câu giải thích, lẫn mất chuỗi thật.
 */
function boBinhLuan(ma) {
  return ma.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const { EN } = await import(
  "file://" + join(SRC, "lib", "tu-dien", "en.ts").replace(/\\/g, "/")
).catch(async () => {
  // en.ts là TypeScript, Node không nạp thẳng được. Đọc thô và bóc khoá.
  const tho = readFileSync(join(SRC, "lib", "tu-dien", "en.ts"), "utf8");
  const khoa = new Set();
  for (const m of tho.matchAll(
    /^\s*(?:"((?:[^"\\]|\\.)*)"|([A-Za-zÀ-ỹ]+)):/gm,
  )) {
    khoa.add((m[1] ?? m[2]).replace(/\\"/g, '"'));
  }
  return { EN: Object.fromEntries([...khoa].map((k) => [k, true])) };
});

const daDich = new Set(Object.keys(EN));

const dem = new Map(); // chuỗi -> { soLan, tep:Set }
let tongDaBoc = 0;

for (const tep of duyet(SRC)) {
  const ma = boBinhLuan(readFileSync(tep, "utf8"));
  const ten = relative(GOC, tep).replace(/\\/g, "/");

  // Chuỗi đã bọc t("…") thì chắc chắn là chuỗi giao diện.
  for (const m of ma.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"\s*\)/g)) {
    const cau = m[1].replace(/\\"/g, '"');
    tongDaBoc++;
    if (daDich.has(cau)) continue;
    ghi(cau, ten);
  }

  // Chuỗi có dấu tiếng Việt chưa bọc t(): ứng viên cần bọc.
  for (const m of ma.matchAll(/"((?:[^"\\\n]|\\.){2,120})"/g)) {
    const cau = m[1];
    if (!CO_DAU.test(cau)) continue;
    if (ma.includes(`t("${cau}")`)) continue;
    ghi(cau, ten, true);
  }
}

function ghi(cau, tep, chuaBoc = false) {
  const cu = dem.get(cau) ?? { soLan: 0, tep: new Set(), chuaBoc: false };
  cu.soLan++;
  cu.tep.add(tep);
  cu.chuaBoc = cu.chuaBoc || chuaBoc;
  dem.set(cau, cu);
}

const tatCa = [...dem.entries()].sort((a, b) => b[1].soLan - a[1].soLan);
// Một chuỗi tính là "dữ liệu" khi nó CHỈ xuất hiện trong các tệp dữ liệu.
// Câu nào vừa nằm ở đó vừa nằm trong một màn hình thì vẫn phải dịch.
const laDuLieu = (v) => [...v.tep].every((f) => DU_LIEU.some((r) => r.test(f)));
const chuaBocTatCa = tatCa.filter(([, v]) => v.chuaBoc);
const duLieu = chuaBocTatCa.filter(([, v]) => laDuLieu(v));
const chuaBoc = chuaBocTatCa.filter(([, v]) => !laDuLieu(v));
const dichThieu = tatCa.filter(([, v]) => !v.chuaBoc);

console.log(`Đã bọc t(): ${tongDaBoc} lượt`);
console.log(`Đã có bản dịch: ${daDich.size} câu`);
console.log(`Bọc t() rồi nhưng CHƯA dịch: ${dichThieu.length} câu`);
console.log(`Chuỗi giao diện CHƯA bọc t(): ${chuaBoc.length} câu`);
console.log(`Chuỗi trong tệp dữ liệu (đếm riêng): ${duLieu.length} câu\n`);

if (process.argv.includes("--tep")) {
  const theoTep = new Map();
  for (const [, v] of chuaBoc)
    for (const f of v.tep) theoTep.set(f, (theoTep.get(f) ?? 0) + 1);
  for (const [f, n] of [...theoTep.entries()].sort((a, b) => b[1] - a[1]))
    console.log(String(n).padStart(4), f);
} else {
  const het = process.argv.includes("--het");
  const hien = (ds, nhan) => {
    if (!ds.length) return;
    console.log(`--- ${nhan} ---`);
    for (const [cau, v] of het ? ds : ds.slice(0, 40))
      console.log(String(v.soLan).padStart(3), JSON.stringify(cau));
    if (!het && ds.length > 40) console.log(`    … còn ${ds.length - 40} câu`);
    console.log();
  };
  hien(dichThieu, "Bọc t() rồi nhưng thiếu bản dịch");
  hien(chuaBoc, "Chưa bọc t()");
}
