import { NextResponse } from "next/server"
import { testDistanceDisplay, formatDistance } from "@/lib/distance"

export async function GET() {
  try {
    // 執行距離顯示測試
    const testDistances = [
      0.001,  // 1公尺
      0.005,  // 5公尺
      0.015,  // 15公尺
      0.025,  // 25公尺
      0.045,  // 45公尺
      0.08,   // 80公尺
      0.15,   // 150公尺
      0.25,   // 250公尺
      0.35,   // 350公尺
      0.55,   // 550公尺
      0.75,   // 750公尺
      0.95,   // 950公尺
      1.2,    // 1.2公里
      1.8,    // 1.8公里
      2.3,    // 2.3公里
      2.8,    // 2.8公里
      4.5,    // 4.5公里
      7.2,    // 7.2公里
      9.8,    // 9.8公里
      12.0,   // 12.0公里
      15.7,   // 15.7公里
      25.3,   // 25.3公里
      45.8,   // 45.8公里
      67.2    // 67.2公里
    ]

    const results = testDistances.map(distance => ({
      original: `${distance.toFixed(3)}km`,
      formatted: formatDistance(distance),
      description: getDistanceDescription(distance)
    }))

    return NextResponse.json({
      success: true,
      message: "距離顯示測試結果",
      results
    })

  } catch (error: any) {
    console.error("距離測試失敗:", error)
    return NextResponse.json(
      { success: false, message: "距離測試失敗", error: error.message },
      { status: 500 }
    )
  }
}

function getDistanceDescription(distance: number): string {
  if (distance < 0.01) {
    return "極近距離 - 精確到1公尺"
  } else if (distance < 0.1) {
    return "很近距離 - 精確到5公尺"
  } else if (distance < 1) {
    return "近距離 - 精確到10公尺"
  } else if (distance < 3) {
    return "中近距離 - 顯示到小數點後一位"
  } else if (distance < 10) {
    return "中距離 - 顯示到小數點後一位"
  } else if (distance < 50) {
    return "遠距離 - 智能顯示（整數或一位小數）"
  } else {
    return "極遠距離 - 顯示整數"
  }
} 