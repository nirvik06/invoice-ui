import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import Autocomplete from '@mui/material/Autocomplete';
import { calculateNetAmount, calculateTotalAmount } from '../utils/calculations';

const InvoiceGrid = ({ items = [], setItems, products = [] }) => {

  /* ================= PRODUCT CHANGE ================= */
  const handleProductChange = (index, product) => {
    if (!product) return;

    const updated = [...items];
    const rate = Number(product.rate || 0);

    const net = calculateNetAmount(rate, updated[index].discount);
    const total = calculateTotalAmount(net, updated[index].qty);

    updated[index] = {
      ...updated[index],
      product_id: product.product_id,
      product_name: product.product_name,
      rate,
      unit: product.unit,
      netAmount: net,
      totalAmount: total
    };

    setItems(updated);
  };

  /* ================= QTY / DISC CHANGE ================= */
  const handleChange = (index, field, value) => {
    const updated = [...items];

    if (value === '') {
      updated[index][field] = '';
      setItems(updated);
      return;
    }

    const num = Number(value);
    if (isNaN(num)) return;

    if (field === 'qty' && num < 1) return;
    if (field === 'discount' && (num < 0 || num > 100)) return;

    updated[index][field] = num;

    const net = calculateNetAmount(updated[index].rate, updated[index].discount);
    const total = calculateTotalAmount(net, updated[index].qty);

    updated[index].netAmount = net;
    updated[index].totalAmount = total;

    setItems(updated);
  };

  /* ================= REMOVE ITEM ================= */
  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  if (!items.length) return null;

  return (
    <TableContainer component={Paper} sx={{ mt: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><b>Product</b></TableCell>
            <TableCell><b>Rate</b></TableCell>
            <TableCell><b>Unit</b></TableCell>
            <TableCell><b>Qty</b></TableCell>
            <TableCell><b>Disc %</b></TableCell>
            <TableCell><b>Net Amount</b></TableCell>
            <TableCell><b>Total Amount</b></TableCell>
            <TableCell><b>Action</b></TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {items.map((item, index) => (
            <TableRow key={index}>

              {/* PRODUCT UPDATE */}
              <TableCell sx={{ minWidth: 220 }}>
                <Autocomplete
                  options={products}
                  getOptionLabel={(o) => o.product_name || ''}
                  value={
                    products.find(p => p.product_id === item.product_id) || null
                  }
                  onChange={(e, value) =>
                    handleProductChange(index, value)
                  }
                  renderInput={(params) => (
                    <TextField {...params} size="small" />
                  )}
                />
              </TableCell>

              <TableCell>{item.rate}</TableCell>
              <TableCell>{item.unit}</TableCell>

              <TableCell>
                <TextField
                  type="number"
                  size="small"
                  value={item.qty}
                  onChange={(e) =>
                    handleChange(index, 'qty', e.target.value)
                  }
                  sx={{ width: 80 }}
                />
              </TableCell>

              <TableCell>
                <TextField
                  type="number"
                  size="small"
                  value={item.discount}
                  onChange={(e) =>
                    handleChange(index, 'discount', e.target.value)
                  }
                  sx={{ width: 80 }}
                />
              </TableCell>

              <TableCell>{item.netAmount.toFixed(2)}</TableCell>
              <TableCell>{item.totalAmount.toFixed(2)}</TableCell>

              <TableCell>
                <IconButton color="error" onClick={() => removeItem(index)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default InvoiceGrid;