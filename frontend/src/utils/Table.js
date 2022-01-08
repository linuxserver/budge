import { forwardRef } from 'react'
import AddBox from '@mui/icons-material/AddBox';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import Check from '@mui/icons-material/Check';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Clear from '@mui/icons-material/Clear';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import Edit from '@mui/icons-material/Edit';
import FilterList from '@mui/icons-material/FilterList';
import FirstPage from '@mui/icons-material/FirstPage';
import LastPage from '@mui/icons-material/LastPage';
import Remove from '@mui/icons-material/Remove';
import SaveAlt from '@mui/icons-material/SaveAlt';
import Search from '@mui/icons-material/Search';
import ViewColumn from '@mui/icons-material/ViewColumn';

export const TableIcons = {
  Add: forwardRef((props, ref) => <AddBox fontSize="small" {...props} ref={ref} />),
  Check: forwardRef((props, ref) => <Check fontSize="small" {...props} ref={ref} />),
  Clear: forwardRef((props, ref) => <Clear fontSize="small" {...props} ref={ref} />),
  Delete: forwardRef((props, ref) => <DeleteOutline fontSize="small" {...props} ref={ref} />),
  DetailPanel: forwardRef((props, ref) => <ChevronRight fontSize="small" {...props} ref={ref} />),
  Edit: forwardRef((props, ref) => <Edit fontSize="small" {...props} ref={ref} />),
  Export: forwardRef((props, ref) => <SaveAlt fontSize="small" {...props} ref={ref} />),
  Filter: forwardRef((props, ref) => <FilterList fontSize="small" {...props} ref={ref} />),
  FirstPage: forwardRef((props, ref) => <FirstPage fontSize="small" {...props} ref={ref} />),
  LastPage: forwardRef((props, ref) => <LastPage fontSize="small" {...props} ref={ref} />),
  NextPage: forwardRef((props, ref) => <ChevronRight fontSize="small" {...props} ref={ref} />),
  PreviousPage: forwardRef((props, ref) => <ChevronLeft fontSize="small" {...props} ref={ref} />),
  ResetSearch: forwardRef((props, ref) => <Clear fontSize="small" {...props} ref={ref} />),
  Search: forwardRef((props, ref) => <Search fontSize="small" {...props} ref={ref} />),
  SortArrow: forwardRef((props, ref) => <ArrowDownward fontSize="small" {...props} ref={ref} />),
  ThirdStateCheck: forwardRef((props, ref) => <Remove fontSize="small" {...props} ref={ref} />),
  ViewColumn: forwardRef((props, ref) => <ViewColumn fontSize="small" {...props} ref={ref} />)
};
