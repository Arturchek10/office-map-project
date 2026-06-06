import ToggleButton from "@mui/material/ToggleButton"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import type { MarkerTypes } from "@shared/types/marker"
import { useState } from "react"

type MarkerTypeFilterProps = {
  onSelectLayer: (layer: MarkerTypes[]) => void
}

export default function MarkerTypeFilter({ onSelectLayer }: MarkerTypeFilterProps) {
  const [selectedLayers, setSelectedLayers] = useState<MarkerTypes[]>([
    "workspace",
    "room",
    "emergency",
    "utility",
  ])

  const handleFormat = (
    _event: React.MouseEvent<HTMLElement>,
    newLayers: MarkerTypes[],
  ) => {
    setSelectedLayers(newLayers)
    onSelectLayer(newLayers)
  }

  return (
    <ToggleButtonGroup
      value={selectedLayers}
      onChange={handleFormat}
      aria-label="Фильтр точек"
      exclusive={false}
    >
      <ToggleButton value="workspace" color="primary">
        места
      </ToggleButton>
      <ToggleButton value="room" color="primary">
        комнаты
      </ToggleButton>
      <ToggleButton value="utility" color="primary">
        служебные зоны
      </ToggleButton>
      <ToggleButton value="emergency" color="primary">
        безопасность
      </ToggleButton>
    </ToggleButtonGroup>
  )
}
