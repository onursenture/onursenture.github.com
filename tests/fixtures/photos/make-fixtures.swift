// Regenerates the photo fixtures (macOS only; sharp can't write HEIC or GPS):
//
//   cd tests/fixtures/photos && swift make-fixtures.swift
//
// exif.heic and exif-gps.jpg are 2000×1500 solid blue with a camera, a
// DateTimeOriginal and a GPS position, so the tests can prove the reader takes
// the first two and never the third. wide.heic is a plain 16:10 HEIC for the
// product-page upload. rotated.heic is laid out like an iPhone portrait: stored
// 2000×1250, red over blue, turned 90° clockwise by its irot box and EXIF
// orientation 6, with the same camera, date and GPS as exif.heic. Shown upright
// it is 1250×2000, blue on the left and red on the right.
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let iPhone = (make: "Apple", model: "iPhone 17 Pro", taken: "2026:10:04 18:22:05")
let blue = CGColor(red: 0.18, green: 0.33, blue: 0.96, alpha: 1)
let red = CGColor(red: 0.9, green: 0.1, blue: 0.1, alpha: 1)

// CoreGraphics counts y from the bottom, so `top` fills the upper half.
func solid(_ width: Int, _ height: Int, _ color: CGColor, top: CGColor? = nil) -> CGImage {
  let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
  context.setFillColor(color)
  context.fill(CGRect(x: 0, y: 0, width: width, height: height))
  if let top {
    context.setFillColor(top)
    context.fill(CGRect(x: 0, y: height / 2, width: width, height: height - height / 2))
  }
  return context.makeImage()!
}

func write(_ file: String, _ type: UTType, _ image: CGImage, _ props: [CFString: Any]) {
  let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: file) as CFURL, type.identifier as CFString, 1, nil)!
  var all = props
  all[kCGImageDestinationLossyCompressionQuality] = 0.5
  CGImageDestinationAddImage(dest, image, all as CFDictionary)
  precondition(CGImageDestinationFinalize(dest))
}

func camera(make: String, model: String, taken: String) -> [CFString: Any] {
  [
    kCGImagePropertyTIFFDictionary: [kCGImagePropertyTIFFMake: make, kCGImagePropertyTIFFModel: model],
    kCGImagePropertyExifDictionary: [kCGImagePropertyExifDateTimeOriginal: taken],
    kCGImagePropertyGPSDictionary: [kCGImagePropertyGPSLatitude: 41.0, kCGImagePropertyGPSLatitudeRef: "N", kCGImagePropertyGPSLongitude: 29.0, kCGImagePropertyGPSLongitudeRef: "E"],
  ]
}

write("exif.heic", .heic, solid(2000, 1500, blue), camera(make: iPhone.make, model: iPhone.model, taken: iPhone.taken))
write("exif-gps.jpg", .jpeg, solid(2000, 1500, blue), camera(make: "FUJIFILM", model: "X100VI", taken: "2026:08:17 18:42:10"))
write("wide.heic", .heic, solid(1280, 800, blue), [:])
write("rotated.heic", .heic, solid(2000, 1250, blue, top: red), camera(make: iPhone.make, model: iPhone.model, taken: iPhone.taken).merging([kCGImagePropertyOrientation: 6]) { $1 })
