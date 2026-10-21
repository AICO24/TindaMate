import os
import struct
import zlib
import math

def create_png(width, height, rgba_data):
    png = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr = b'IHDR' + ihdr_data
    ihdr_crc = struct.pack('>I', zlib.crc32(ihdr) & 0xffffffff)
    png += struct.pack('>I', len(ihdr_data)) + ihdr + ihdr_crc

    scanlines = bytearray()
    for y in range(height):
        scanlines.append(0)
        start = y * width * 4
        scanlines.extend(rgba_data[start:start + width * 4])

    compressed = zlib.compress(bytes(scanlines), 9)
    idat = b'IDAT' + compressed
    idat_crc = struct.pack('>I', zlib.crc32(idat) & 0xffffffff)
    png += struct.pack('>I', len(compressed)) + idat + idat_crc

    iend = b'IEND'
    iend_crc = struct.pack('>I', zlib.crc32(iend) & 0xffffffff)
    png += struct.pack('>I', 0) + iend + iend_crc
    return png

W, H = 96, 96
pixels = bytearray(W * H * 4)

def set_pixel(x, y, r, g, b, a):
    if 0 <= x < W and 0 <= y < H:
        idx = (y * W + x) * 4
        src_a = a / 255.0
        dst_r, dst_g, dst_b = pixels[idx], pixels[idx+1], pixels[idx+2]
        dst_a = pixels[idx+3] / 255.0
        out_a = src_a + dst_a * (1.0 - src_a)
        if out_a > 0:
            pixels[idx] = int((r * src_a + dst_r * dst_a * (1.0 - src_a)) / out_a)
            pixels[idx+1] = int((g * src_a + dst_g * dst_a * (1.0 - src_a)) / out_a)
            pixels[idx+2] = int((b * src_a + dst_b * dst_a * (1.0 - src_a)) / out_a)
            pixels[idx+3] = int(out_a * 255)

# 1. Fill circle with Facebook blue (#1877F2: 24, 119, 242)
cx, cy, radius = 48.0, 48.0, 44.0
for y in range(H):
    for x in range(W):
        d = math.hypot(x - cx, y - cy)
        if d <= radius + 0.5:
            alpha = int(255 * min(1.0, max(0.0, radius - d + 0.5)))
            set_pixel(x, y, 24, 119, 242, alpha)

# 2. Draw white 'f'
# Stem: x from 45 to 57, y from 38 to 92
# Crossbar: x from 34 to 68, y from 44 to 54
# Top curve: arc curving right at the top
def draw_rect(x0, y0, w, h):
    for y in range(int(y0), int(y0 + h)):
        for x in range(int(x0), int(x0 + w)):
            # Must stay within circle
            if math.hypot(x - cx, y - cy) <= radius:
                set_pixel(x, y, 255, 255, 255, 255)

# Stem
draw_rect(47, 36, 12, 56)
# Crossbar
draw_rect(34, 46, 32, 11)

# Top hook
for y in range(20, 37):
    for x in range(47, 72):
        # Curve equation
        dx = x - 59
        dy = y - 36
        d = math.hypot(dx, dy)
        if 8 <= d <= 20 and x >= 47 and y <= 36:
            set_pixel(x, y, 255, 255, 255, 255)

out_path = r'c:\TindaMate\assets\images\auth\facebook.png'
with open(out_path, 'wb') as f:
    f.write(create_png(W, H, pixels))

print(f"Generated {out_path} ({os.path.getsize(out_path)} bytes)")

