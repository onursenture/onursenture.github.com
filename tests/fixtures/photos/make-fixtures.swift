// Regenerates the EXIF fixtures (macOS only; sharp can't write HEIC or GPS):
//
//   cd tests/fixtures/photos && swift make-fixtures.swift
//
// Both are 2000×1500 solid blue with a camera, a DateTimeOriginal and a GPS
// position, so the tests can prove the reader takes the first two and never
// the third.
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let width = 2000, height = 1500
let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
context.setFillColor(CGColor(red: 0.18, green: 0.33, blue: 0.96, alpha: 1))
context.fill(CGRect(x: 0, y: 0, width: width, height: height))
let image = context.makeImage()!

func write(_ file: String, _ type: UTType, make: String, model: String, taken: String) {
  let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: file) as CFURL, type.identifier as CFString, 1, nil)!
  let props: [CFString: Any] = [
    kCGImagePropertyTIFFDictionary: [kCGImagePropertyTIFFMake: make, kCGImagePropertyTIFFModel: model],
    kCGImagePropertyExifDictionary: [kCGImagePropertyExifDateTimeOriginal: taken],
    kCGImagePropertyGPSDictionary: [kCGImagePropertyGPSLatitude: 41.0, kCGImagePropertyGPSLatitudeRef: "N", kCGImagePropertyGPSLongitude: 29.0, kCGImagePropertyGPSLongitudeRef: "E"],
    kCGImageDestinationLossyCompressionQuality: 0.5,
  ]
  CGImageDestinationAddImage(dest, image, props as CFDictionary)
  precondition(CGImageDestinationFinalize(dest))
}

write("exif.heic", .heic, make: "Apple", model: "iPhone 17 Pro", taken: "2026:10:04 18:22:05")
write("exif-gps.jpg", .jpeg, make: "FUJIFILM", model: "X100VI", taken: "2026:08:17 18:42:10")
