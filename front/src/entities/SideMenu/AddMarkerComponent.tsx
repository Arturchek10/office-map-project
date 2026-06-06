import AddMarkerBtn from "@entities/elements/AddMarkerBtn"
type SideMenuComponentProps = {
  handleAddMarker: (event: React.MouseEvent<HTMLElement>) => any
}

export default function SideMenuComponent({handleAddMarker} : SideMenuComponentProps){
  return (
    <div className="flex flex-col p-2 gap-10 items-center">  
      <AddMarkerBtn handleAddMarker={handleAddMarker} />
    </div>
  )
}