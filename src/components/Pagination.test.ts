import { afterEach, describe, expect, it, vi } from "vitest";
import { demCot } from "./Pagination";

/**
 * Đếm số cột của lưới để tính cỡ trang vừa màn hình.
 *
 * Hàm này đã sai thật: nó chia chiều cao còn lại cho chiều cao MỘT THẺ rồi
 * tưởng kết quả là số thẻ — trong khi một hàng lưới chứa nhiều thẻ. Hậu quả
 * nhìn thấy được: màn 1440×900 còn trống nửa dưới mà chỉ hiện 3 trên 7 Reader,
 * và hàng cuối lẻ đúng một thẻ.
 *
 * Nên phép kiểm ở đây không phải hình thức: nó chốt lại rằng số cột được đọc
 * từ style ĐÃ TÍNH, không đoán theo tham số tĩnh — vì số cột đổi theo điểm ngắt
 * (một cột trên điện thoại, hai trên máy tính), và một tham số tĩnh sẽ sai đúng
 * ở nửa số kích thước màn hình.
 */
describe("demCot", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  /** Dựng phần tử bọc có một lưới con với gridTemplateColumns cho trước. */
  function boc(ranh: string | null): HTMLElement {
    const el = document.createElement("div");
    const luoi = document.createElement("div");
    el.appendChild(luoi);
    document.body.appendChild(el);
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      gridTemplateColumns: ranh,
    } as unknown as CSSStyleDeclaration);
    return el;
  }

  it("đọc đúng số rãnh cột từ style đã tính", () => {
    expect(demCot(boc("300px 300px 300px"))).toBe(3);
  });

  it("một cột thì trả 1", () => {
    expect(demCot(boc("1fr"))).toBe(1);
  });

  it("khoảng trắng thừa không làm lệch phép đếm", () => {
    // getComputedStyle thật trả về chuỗi đã chuẩn hoá, nhưng đừng dựa vào đó.
    expect(demCot(boc("  300px   300px  "))).toBe(2);
  });

  it('không phải lưới ("none") thì coi như một cột', () => {
    expect(demCot(boc("none"))).toBe(1);
  });

  it("style rỗng cũng coi như một cột, không trả 0", () => {
    // Trả 0 thì phép nhân ở nơi gọi ra 0 mục mỗi trang, và danh sách trắng.
    expect(demCot(boc(null))).toBe(1);
    expect(demCot(boc(""))).toBe(1);
  });

  it("BẢNG thì luôn là một cột, dù bên trong có lưới gì", () => {
    const el = document.createElement("div");
    el.innerHTML = "<table><tbody><tr><td>x</td></tr></tbody></table>";
    document.body.appendChild(el);

    // Bảng xếp theo hàng: mỗi bản ghi là một dòng, không phải một ô lưới.
    // Nhân số dòng với số cột ở đây là tính ra gấp nhiều lần số bản ghi vừa
    // màn hình.
    expect(demCot(el)).toBe(1);
  });

  it("không có phần tử con nào thì trả 1, không nổ", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    expect(demCot(el)).toBe(1);
  });

  it("con đầu là node văn bản thì cũng trả 1", () => {
    const el = document.createElement("div");
    el.appendChild(document.createTextNode("chữ"));
    document.body.appendChild(el);

    expect(demCot(el)).toBe(1);
  });
});
