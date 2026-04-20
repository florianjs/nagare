declare module 'heatmap.js' {
  interface HeatmapConfig {
    container: HTMLElement
    radius?: number
    blur?: number
    maxOpacity?: number
    minOpacity?: number
    gradient?: Record<number, string>
  }

  interface HeatmapData {
    max: number
    min: number
    data: { x: number; y: number; value: number }[]
  }

  interface HeatmapInstance {
    setData(data: HeatmapData): void
    addData(point: { x: number; y: number; value: number }): void
    repaint(): void
    getData(): HeatmapData
    getValueAt(point: { x: number; y: number }): number
  }

  const h337: {
    create(config: HeatmapConfig): HeatmapInstance
  }

  export default h337
}
