import { useEffect, useState } from 'react';
import {
  TextField,
  Button,
  Grid,
  Paper,
  Typography,
  Box,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import api from '../services/api';
import InvoiceGrid from './InvoiceGrid';
import {
  calculateNetAmount,
  calculateTotalAmount
} from '../utils/calculations';

const InvoiceForm = () => {
  const [customerName, setCustomerName] = useState('');
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);

  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [form, setForm] = useState({
    product_id: '',
    product_name: '',
    rate: 0,
    unit: '',
    qty: 1,
    discount: 0,
    netAmount: 0,
    totalAmount: 0
  });

  /* ===================== FETCH PRODUCTS ===================== */
  useEffect(() => {
    api.get('/products')
      .then(res => setProducts(res.data))
      .catch(() => {
        setSnackbar({
          open: true,
          message: 'Failed to load products',
          severity: 'error'
        });
      });
  }, []);

  /* ===================== VALIDATION ===================== */
  const validateItem = () => {
    const err = {};

    if (!form.product_id) err.product = 'Select a product';
    if (form.qty === '' || Number(form.qty) <= 0)
      err.qty = 'Qty must be greater than 0';
    if (
      form.discount === '' ||
      Number(form.discount) < 0 ||
      Number(form.discount) > 100
    )
      err.discount = 'Discount must be 0–100';

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const validateInvoice = () => {
    const err = {};

    if (!customerName.trim())
      err.customerName = 'Customer name is required';
    if (items.length === 0)
      err.items = 'Add at least one product';

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  /* ===================== PRODUCT SELECT ===================== */
  const onProductSelect = (product) => {
    console.log('product============>', product);
    
    if (!product) return;

    const rate = Number(product.rate || 0);
    const discount = Number(form.discount || 0);
    const qty = Number(form.qty || 1);

    const net = calculateNetAmount(rate, discount);
    const total = calculateTotalAmount(net, qty);

    setForm({
        product_id: product.product_id,
        product_name: product.product_name,
        rate,
        unit: product.unit || '',
        qty,
        discount,
        netAmount: net,
        totalAmount: total
    });
    };

  /* ===================== QTY / DISC ===================== */
  const onQtyDiscChange = (key, value) => {
    if (value === '') {
      setForm(prev => ({ ...prev, [key]: '' }));
      return;
    }

    const num = Number(value);
    if (isNaN(num)) return;

    const safeQty =
      key === 'qty' ? Math.max(1, num) : Number(form.qty || 1);
    const safeDisc =
      key === 'discount'
        ? Math.min(100, Math.max(0, num))
        : Number(form.discount || 0);

    const net = calculateNetAmount(form.rate, safeDisc);
    const total = calculateTotalAmount(net, safeQty);

    setForm({
      ...form,
      qty: safeQty,
      discount: safeDisc,
      netAmount: net,
      totalAmount: total
    });

    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  /* ===================== ADD ITEM ===================== */
  const addItem = () => {
    if (!validateItem()) return;

    setItems([
      ...items,
      {
        ...form,
        qty: Number(form.qty),
        discount: Number(form.discount)
      }
    ]);

    setForm({
      product_id: '',
      product_name: '',
      rate: 0,
      unit: '',
      qty: 1,
      discount: 0,
      netAmount: 0,
      totalAmount: 0
    });

    setErrors({});
  };

  /* ===================== TOTAL ===================== */
  const invoiceTotal = items.reduce(
    (sum, item) => sum + item.totalAmount,
    0
  );

  /* ===================== FINAL SAVE ===================== */
  const finalSubmit = async () => {
    if (!validateInvoice()) {
        window.scroll(0, 0);
        return;
    }

    try {
      await api.post('/invoices', {
        customerName,
        items,
        totalAmount: invoiceTotal
      });

      setSnackbar({
        open: true,
        message: 'Invoice saved successfully',
        severity: 'success'
      });

      setCustomerName('');
      setItems([]);
      setErrors({});
    } catch {
      setSnackbar({
        open: true,
        message: 'Failed to save invoice',
        severity: 'error'
      });
    }
  };

  return (
    <Box sx={{ backgroundColor: '#f5f7fa', minHeight: '100vh', p: 2 }}>
      <Paper sx={{ p: 3 }}>

        <Typography variant="h6">Invoice Details</Typography>

        <TextField
          label="Customer Name"
          fullWidth
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
          error={!!errors.customerName}
          helperText={errors.customerName}
          sx={{ my: 3 }}
        />

        <Divider sx={{ mb: 3 }} />

        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Add Product
        </Typography>

        <Grid container spacing={2} alignItems="center">

          <Grid item xs={12} md={6}>
            <Autocomplete
              options={products}
              getOptionLabel={(o) => o.product_name || ''}
              value={
                products.find(p => p.product_id === form.product_id) || null
              }
              onChange={(e, value) => onProductSelect(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Product"
                  error={!!errors.product}
                  helperText={errors.product}
                  sx={{ minWidth: 380,'& .MuiOutlinedInput-root': { height: 64 } }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField label="Rate" value={form.rate} disabled fullWidth />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField label="Unit" placeholder="Unit" value={form.unit} disabled fullWidth InputLabelProps={{ shrink: true }}/>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              label="Qty"
              type="number"
              value={form.qty}
              onChange={e => onQtyDiscChange('qty', e.target.value)}
              error={!!errors.qty}
              helperText={errors.qty}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              label="Disc %"
              type="number"
              value={form.discount}
              onChange={e => onQtyDiscChange('discount', e.target.value)}
              error={!!errors.discount}
              helperText={errors.discount}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              label="Net Amount"
              value={form.netAmount.toFixed(2)}
              disabled
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={3} display="flex" alignItems="center">
            <Button
              variant="contained"
              size="large"
              fullWidth
              sx={{ height: 56 }}
              onClick={addItem}
              disabled={!form.product_id}
            >
              ADD ITEM
            </Button>
          </Grid>
        </Grid>

        <InvoiceGrid items={items} setItems={setItems} products={products} />

        {errors.items && (
          <Typography color="error" sx={{ mt: 1 }}>
            {errors.items}
          </Typography>
        )}

        <Box
          sx={{
            mt: 3,
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            backgroundColor: '#eef2f7',
            borderRadius: 2
          }}
        >
          <Typography variant="h6">Invoice Total</Typography>
          <Typography variant="h5" color="primary" fontWeight="bold">
            ₹ {invoiceTotal.toFixed(2)}
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'right', mt: 3 }}>
          <Button
            variant="contained"
            color="success"
            size="large"
            onClick={finalSubmit}
            disabled={items.length === 0}
          >
            Submit
          </Button>
        </Box>

      </Paper>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InvoiceForm;