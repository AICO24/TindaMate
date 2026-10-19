import os
import struct
import zlib
import math

def create_png(width, height, rgba_data):
    """
    Creates a valid PNG byte string from raw RGBA pixel data.
    """
    # Header
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk: width, height, bit_depth=8, color_type=6 (RGBA), compression=0, filter=0, interlace=0
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr = b'IHDR' + ihdr_data
    ihdr_crc = struct.pack('>I', zlib.crc32(ihdr) & 0xffffffff)
    png += struct.pack('>I', len(ihdr_data)) + ihdr + ihdr_crc
    
    # IDAT chunk: raw scanlines with filter byte 0 at start of each line
    scanlines = bytearray()
    for y in range(height):
        scanlines.append(0) # filter byte: None
        start = y * width * 4
        scanlines.extend(rgba_data[start:start + width * 4])
        
    compressed = zlib.compress(bytes(scanlines), 9)
    idat = b'IDAT' + compressed
    idat_crc = struct.pack('>I', zlib.crc32(idat) & 0xffffffff)
    png += struct.pack('>I', len(compressed)) + idat + idat_crc
    
    # IEND chunk
    iend = b'IEND'
    iend_crc = struct.pack('>I', zlib.crc32(iend) & 0xffffffff)
    png += struct.pack('>I', 0) + iend + iend_crc
    
    return png

class Canvas:
    def __init__(self, w, h):
        self.w = w
        self.h = h
        self.pixels = bytearray(w * h * 4)

    def set_pixel(self, x, y, r, g, b, a):
        if 0 <= x < self.w and 0 <= y < self.h:
            idx = (y * self.w + x) * 4
            src_a = a / 255.0
            if src_a == 1.0:
                self.pixels[idx] = r
                self.pixels[idx+1] = g
                self.pixels[idx+2] = b
                self.pixels[idx+3] = a
            elif src_a > 0.0:
                dst_r = self.pixels[idx]
                dst_g = self.pixels[idx+1]
                dst_b = self.pixels[idx+2]
                dst_a = self.pixels[idx+3] / 255.0
                out_a = src_a + dst_a * (1.0 - src_a)
                if out_a > 0:
                    self.pixels[idx] = int((r * src_a + dst_r * dst_a * (1.0 - src_a)) / out_a)
                    self.pixels[idx+1] = int((g * src_a + dst_g * dst_a * (1.0 - src_a)) / out_a)
                    self.pixels[idx+2] = int((b * src_a + dst_b * dst_a * (1.0 - src_a)) / out_a)
                    self.pixels[idx+3] = int(out_a * 255)

    def fill_rect(self, x0, y0, w, h, r, g, b, a=255):
        for y in range(int(y0), int(y0 + h)):
            for x in range(int(x0), int(x0 + w)):
                self.set_pixel(x, y, r, g, b, a)

    def draw_line(self, x0, y0, x1, y1, width, r, g, b, a=255):
        dx = x1 - x0
        dy = y1 - y0
        length = math.hypot(dx, dy)
        if length == 0:
            return
        steps = int(length * 2.5)
        radius = width / 2.0
        for i in range(steps + 1):
            t = i / steps
            cx = x0 + dx * t
            cy = y0 + dy * t
            for py in range(int(cy - radius - 1), int(cy + radius + 2)):
                for px in range(int(cx - radius - 1), int(cx + radius + 2)):
                    d = math.hypot(px - cx, py - cy)
                    if d <= radius:
                        alpha = int(a * min(1.0, max(0.0, radius - d + 0.5)))
                        self.set_pixel(px, py, r, g, b, alpha)

    def draw_circle(self, cx, cy, radius, stroke_width, r, g, b, a=255, fill=None):
        r_outer = radius + stroke_width / 2.0
        r_inner = radius - stroke_width / 2.0 if not fill else 0.0
        for y in range(int(cy - r_outer - 1), int(cy + r_outer + 2)):
            for x in range(int(cx - r_outer - 1), int(cx + r_outer + 2)):
                d = math.hypot(x - cx, y - cy)
                if fill:
                    if d <= radius:
                        alpha = int(a * min(1.0, max(0.0, radius - d + 0.5)))
                        self.set_pixel(x, y, fill[0], fill[1], fill[2], alpha)
                else:
                    if r_inner - 0.5 <= d <= r_outer + 0.5:
                        edge_dist = min(d - r_inner, r_outer - d)
                        alpha = int(a * min(1.0, max(0.0, edge_dist + 0.5)))
                        if alpha > 0:
                            self.set_pixel(x, y, r, g, b, alpha)

    def downsample(self, factor=2):
        new_w = self.w // factor
        new_h = self.h // factor
        out = bytearray(new_w * new_h * 4)
        for ny in range(new_h):
            for nx in range(new_w):
                sum_r, sum_g, sum_b, sum_a = 0, 0, 0, 0
                for sy in range(factor):
                    for sx in range(factor):
                        ox = nx * factor + sx
                        oy = ny * factor + sy
                        idx = (oy * self.w + ox) * 4
                        sum_r += self.pixels[idx]
                        sum_g += self.pixels[idx+1]
                        sum_b += self.pixels[idx+2]
                        sum_a += self.pixels[idx+3]
                count = factor * factor
                out_idx = (ny * new_w + nx) * 4
                out[out_idx] = sum_r // count
                out[out_idx+1] = sum_g // count
                out[out_idx+2] = sum_b // count
                out[out_idx+3] = sum_a // count
        return new_w, new_h, out

def generate_icons():
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'assets', 'images', 'auth')
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. MAIL ICON (96x96 -> 48x48)
    c = Canvas(96, 96)
    # Envelope outer rounded rect
    # Top flap lines
    color = (100, 116, 139) # #64748B
    # Outer box: left=14, top=24, right=82, bottom=72, rx=8
    # Top edge
    c.draw_line(22, 24, 74, 24, 6.0, *color)
    # Bottom edge
    c.draw_line(22, 72, 74, 72, 6.0, *color)
    # Left edge
    c.draw_line(14, 32, 14, 64, 6.0, *color)
    # Right edge
    c.draw_line(82, 32, 82, 64, 6.0, *color)
    # Corners
    c.draw_line(14, 32, 22, 24, 6.0, *color)
    c.draw_line(82, 32, 74, 24, 6.0, *color)
    c.draw_line(14, 64, 22, 72, 6.0, *color)
    c.draw_line(82, 64, 74, 72, 6.0, *color)
    # V-flap
    c.draw_line(16, 26, 48, 52, 6.0, *color)
    c.draw_line(80, 26, 48, 52, 6.0, *color)
    w, h, data = c.downsample(2)
    with open(os.path.join(output_dir, 'mail.png'), 'wb') as f:
        f.write(create_png(w, h, data))
        
    # 2. EYE ICON (96x96 -> 48x48)
    c = Canvas(96, 96)
    # Almond shape: upper arc and lower arc
    # Upper arc from (12, 48) to (84, 48) with peak at (48, 24)
    # Lower arc from (12, 48) to (84, 48) with valley at (48, 72)
    steps = 40
    for i in range(steps):
        t0 = i / steps
        t1 = (i + 1) / steps
        # Upper curve quadratic bezier: P0=(12, 48), P1=(48, 18), P2=(84, 48)
        x0 = (1-t0)**2 * 12 + 2*(1-t0)*t0 * 48 + t0**2 * 84
        y0 = (1-t0)**2 * 48 + 2*(1-t0)*t0 * 18 + t0**2 * 48
        x1 = (1-t1)**2 * 12 + 2*(1-t1)*t1 * 48 + t1**2 * 84
        y1 = (1-t1)**2 * 48 + 2*(1-t1)*t1 * 18 + t1**2 * 48
        c.draw_line(x0, y0, x1, y1, 6.0, *color)
        
        # Lower curve quadratic bezier: P0=(12, 48), P1=(48, 78), P2=(84, 48)
        y0_l = (1-t0)**2 * 48 + 2*(1-t0)*t0 * 78 + t0**2 * 48
        y1_l = (1-t1)**2 * 48 + 2*(1-t1)*t1 * 78 + t1**2 * 48
        c.draw_line(x0, y0_l, x1, y1_l, 6.0, *color)
        
    # Pupil circle in center
    c.draw_circle(48, 48, 12, 6.0, *color, fill=color)
    w, h, data = c.downsample(2)
    with open(os.path.join(output_dir, 'eye.png'), 'wb') as f:
        f.write(create_png(w, h, data))

    # 3. EYE-OFF ICON (96x96 -> 48x48)
    # Copy eye and draw clean diagonal slash across it
    c.draw_line(14, 18, 82, 78, 6.5, *color)
    w, h, data = c.downsample(2)
    with open(os.path.join(output_dir, 'eye-off.png'), 'wb') as f:
        f.write(create_png(w, h, data))

    # 4. OFFICIAL GOOGLE 'G' 4-COLOR LOGO (96x96 -> 48x48)
    c = Canvas(96, 96)
    # Google G has outer radius ~38, inner radius ~22 (thickness 16)
    # Segments:
    # Red: Top (from 45 deg to 135 deg)
    # Yellow: Left (from 135 deg to 225 deg)
    # Green: Bottom (from 225 deg to 315 deg)
    # Blue: Right arm & bar
    cx, cy = 48, 48
    r_out = 38
    r_in = 22
    for y in range(96):
        for x in range(96):
            d = math.hypot(x - cx, y - cy)
            if r_in - 0.5 <= d <= r_out + 0.5:
                angle = math.degrees(math.atan2(cy - y, x - cx)) # 0 is right, 90 is top
                if angle < 0:
                    angle += 360
                
                # Check top-right cutout: between 0 and 45 degrees
                if 0 <= angle <= 45:
                    continue
                
                edge_alpha = min(1.0, max(0.0, min(d - (r_in - 0.5), (r_out + 0.5) - d)))
                if edge_alpha <= 0:
                    continue
                    
                # Color mapping
                if 45 < angle <= 135:
                    # Red #EA4335
                    col = (234, 67, 53)
                elif 135 < angle <= 225:
                    # Yellow #FBBC05
                    col = (251, 188, 5)
                elif 225 < angle <= 315:
                    # Green #34A853
                    col = (52, 168, 83)
                else:
                    # Blue #4285F4
                    col = (66, 133, 244)
                c.set_pixel(x, y, col[0], col[1], col[2], int(255 * edge_alpha))
                
    # Horizontal Blue Bar reaching from center (48, 48) to right (86, 48)
    # bar thickness ~15
    for by in range(40, 56):
        for bx in range(48, 86):
            c.set_pixel(bx, by, 66, 133, 244, 255)
            
    w, h, data = c.downsample(2)
    with open(os.path.join(output_dir, 'google.png'), 'wb') as f:
        f.write(create_png(w, h, data))

    # 5. LOCK GREEN (96x96 -> 48x48)
    c = Canvas(96, 96)
    # Shackle arch
    green = (13, 122, 77) # #0D7A4D
    for i in range(30):
        a0 = math.pi * (i / 30.0)
        a1 = math.pi * ((i + 1) / 30.0)
        sx0 = 48 + 17 * math.cos(math.pi - a0)
        sy0 = 42 - 17 * math.sin(math.pi - a0)
        sx1 = 48 + 17 * math.cos(math.pi - a1)
        sy1 = 42 - 17 * math.sin(math.pi - a1)
        c.draw_line(sx0, sy0, sx1, sy1, 6.0, *green)
    c.draw_line(31, 42, 31, 48, 6.0, *green)
    c.draw_line(65, 42, 65, 48, 6.0, *green)
    # Solid Green Body
    c.fill_rect(24, 46, 48, 36, *green)
    # Keyhole white
    c.draw_circle(48, 60, 4.5, 1, 255, 255, 255, fill=(255, 255, 255))
    c.fill_rect(46, 62, 4, 9, 255, 255, 255)
    w, h, data = c.downsample(2)
    with open(os.path.join(output_dir, 'lock-green.png'), 'wb') as f:
        f.write(create_png(w, h, data))

    # 6. LOCK OUTLINE (96x96 -> 48x48)
    c = Canvas(96, 96)
    for i in range(30):
        a0 = math.pi * (i / 30.0)
        a1 = math.pi * ((i + 1) / 30.0)
        sx0 = 48 + 17 * math.cos(math.pi - a0)
        sy0 = 42 - 17 * math.sin(math.pi - a0)
        sx1 = 48 + 17 * math.cos(math.pi - a1)
        sy1 = 42 - 17 * math.sin(math.pi - a1)
        c.draw_line(sx0, sy0, sx1, sy1, 6.0, *color)
    c.draw_line(31, 42, 31, 48, 6.0, *color)
    c.draw_line(65, 42, 65, 48, 6.0, *color)
    # Outline Body
    c.draw_line(26, 46, 70, 46, 6.0, *color)
    c.draw_line(26, 80, 70, 80, 6.0, *color)
    c.draw_line(24, 48, 24, 78, 6.0, *color)
    c.draw_line(72, 48, 72, 78, 6.0, *color)
    c.draw_circle(48, 60, 4.5, 1, *color, fill=color)
    c.fill_rect(46, 62, 4, 9, *color)
    w, h, data = c.downsample(2)
    with open(os.path.join(output_dir, 'lock.png'), 'wb') as f:
        f.write(create_png(w, h, data))

    # 7. USER ICON (96x96 -> 48x48)
    c = Canvas(96, 96)
    # Head circle
    c.draw_circle(48, 30, 15, 6.0, *color)
    # Shoulders arch
    for i in range(30):
        a0 = math.pi * (i / 30.0)
        a1 = math.pi * ((i + 1) / 30.0)
        sx0 = 48 + 28 * math.cos(math.pi - a0)
        sy0 = 84 - 24 * math.sin(math.pi - a0)
        sx1 = 48 + 28 * math.cos(math.pi - a1)
        sy1 = 84 - 24 * math.sin(math.pi - a1)
        c.draw_line(sx0, sy0, sx1, sy1, 6.0, *color)
    w, h, data = c.downsample(2)
    with open(os.path.join(output_dir, 'user.png'), 'wb') as f:
        f.write(create_png(w, h, data))

    print("Successfully generated all auth PNG icons in", output_dir)

if __name__ == '__main__':
    generate_icons()

