import FurnitureOnMap from "@features/addingFurniture/FurnitureOnMap"
import { Marker, MarkerResponse, MarkerTypes } from "@shared/types/marker"
import Konva from "konva"
import { Layer, Stage } from "react-konva"
import MarkersLayer from "./MarkersLayer"
import { Image } from "react-konva"
type FloorStageProps = {
  stageRef: React.RefObject<Konva.Stage | null>
  stageSize: { x: number; y: number }
  scale: number
  onWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void
  clickedMarker: MarkerResponse | null
  setClickedMarker: (m: MarkerResponse | null) => void
  markers: Marker[]
  selectedMarkerIds?: number[]
  newMarkerId: number | null
  image?: HTMLImageElement | null
  imageStatus: "loading" | "loaded" | "failed"
  startImagePosition: { x: number; y: number }
  startImageScale: number
  furnitureOnMap: {
    id: number
    name: string
    photo: string
    position: {
      position_x: number
      position_y: number
    }
    width: number
    height: number
    angle: number
  }[]
  updateFurniturePosition: (id: number, x: number, y: number) => void
  updateFurnitureSize: (id: number, w: number, h: number) => void
  updateFurnitureAngle: (id: number, angle: number) => void
  panelOpen: boolean
  handleCircleClick: (
    e: Konva.KonvaEventObject<MouseEvent>,
    marker: Marker
  ) => void
  markerScale: number
  visibleTypes: MarkerTypes[]
  onFurnitureContextMenu?: (id: number, pos: { x: number; y: number }) => void
  editable: boolean
}

export default function FloorStage(props: FloorStageProps) {
  const imageWidth = props.image?.width ?? 0
  const imageHeight = props.image?.height ?? 0

  return (
    <Stage
      ref={props.stageRef}  
      width={props.stageSize.x}
      height={props.stageSize.y}
      draggable
      scaleX={props.scale}
      scaleY={props.scale}
      onWheel={props.onWheel}
      onClick={(e) => {
        const targetClass = e.target.getClassName()
        if (["Stage", "Layer", "Image"].includes(targetClass)) {
          props.setClickedMarker(null)
        }
      }}
      onMouseMove={(e) => {
        const stage = e.target.getStage()
        if (!stage) return
        stage.container().style.cursor =
          e.target.getClassName() === "Circle" ? "pointer" : "grab"
      }}
      onContextMenu={(e) => e.evt.preventDefault()}
    >
      {props.imageStatus === "loaded" && (
        <Layer>
          <Image
            image={props.image as CanvasImageSource}
            x={props.startImagePosition.x}
            y={props.startImagePosition.y}
            width={imageWidth * props.startImageScale}
            height={imageHeight * props.startImageScale}
          />
        </Layer>
      )}

      <Layer>
        {props.furnitureOnMap.map((item) => {
          const x =
            item.position.position_x * props.startImageScale +
            props.startImagePosition.x
          const y =
            item.position.position_y * props.startImageScale +
            props.startImagePosition.y

          return (
            <FurnitureOnMap
              key={item.id}
              id={item.id}
              photo={item.photo}
              x={x}
              y={y}
              initialWidth={item.width}
              initialHeight={item.height}
              rotation={item.angle}
              editable={props.editable}
              onPositionChange={(x, y) =>
                props.updateFurniturePosition(item.id, x, y)
              }
              onSizeChange={(w, h) => props.updateFurnitureSize(item.id, w, h)}
              onRotationChange={(angle) =>
                props.updateFurnitureAngle(item.id, angle)
              }
              onContextMenu={props.onFurnitureContextMenu}
            />
          )
        })}
      </Layer>

      <MarkersLayer
        markers={props.markers}
        selectedMarkerIds={props.selectedMarkerIds}
        newMarkerId={props.newMarkerId}
        clickedMarker={props.clickedMarker}
        handleCircleClick={props.handleCircleClick}
        markerScale={props.markerScale}
        startImagePosition={props.startImagePosition}
        startImageScale={props.startImageScale}
        visibleTypes={props.visibleTypes}
        imageStatus={props.imageStatus}
        editable={props.editable}
      />
    </Stage>
  )
}
