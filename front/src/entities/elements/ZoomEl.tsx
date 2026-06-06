
import ButtonGroup from '@mui/material/ButtonGroup';
import Button from '@mui/material/Button';
import PlusIcon from '../svg/plus.svg?react';
import MinusIcon from '../svg/minus.svg?react';

type ZoomElProps = {
  increaseImage: () => void;
  decreaseImage: () => void;
};

export default function ZoomEl({increaseImage, decreaseImage} : ZoomElProps) {
  return (
    <ButtonGroup
      disableElevation
      variant="contained"
      color='inherit'
      // aria-label="Disabled button group"
    >
      <Button onClick={increaseImage}>
        <PlusIcon style={{width: "15px", height: "15px"}} />
      </Button>
      <Button onClick={decreaseImage}>
        <MinusIcon style={{width: "15px", height: "15px"}}/>
      </Button>
    </ButtonGroup>
  );
}