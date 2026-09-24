import { supabase, getCurrentUser, ensureProfile } from './supabase.js';

const form = document.getElementById('listingForm');
const status = document.getElementById('formStatus');
const submitButton = form.querySelector('.submit-listing');
const priceInput = form.elements.price;
const descriptionInput = form.elements.description;
const imageInput = form.elements.image_url;
const preview = document.getElementById('imagePreview');
const summaryImage = document.getElementById('summaryImage');

function show(message, ok = false) {
  status.textContent = message;
  status.className = 'form-status ' + (ok ? 'ok' : 'error');
}

function money(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0
    ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(number)
    : '₦—';
}

function setBusy(busy) {
  submitButton.disabled = busy;
  submitButton.classList.toggle('is-loading', busy);
  submitButton.querySelector('span').textContent = busy ? 'Submitting…' : 'Submit listing';
}

function updateSummary() {
  document.getElementById('summaryName').textContent = form.elements.name.value.trim() || 'Your car will appear here';
  document.getElementById('summaryType').textContent = form.elements.type.value || 'YOUR CAR';
  document.getElementById('summaryPrice').textContent = money(priceInput.value);
  document.getElementById('summaryLocation').textContent = form.elements.location.value.trim() || 'Location';
  document.getElementById('summaryMileage').textContent = form.elements.mileage.value ? Number(form.elements.mileage.value).toLocaleString() + ' km' : '— km';
}

function updateImagePreview() {
  const url = imageInput.value.trim();
  preview.innerHTML = '';
  summaryImage.innerHTML = '';

  if (!url) {
    preview.innerHTML = '<span>PHOTO PREVIEW</span><strong>Paste an image URL above</strong>';
    summaryImage.textContent = '🚘';
    summaryImage.classList.remove('has-image');
    return;
  }

  const img = new Image();
  img.onload = () => {
    const clone = img.cloneNode();
    clone.alt = 'Vehicle preview';
    preview.appendChild(clone);
    summaryImage.appendChild(img);
    summaryImage.classList.add('has-image');
  };
  img.onerror = () => {
    preview.innerHTML = '<span>IMAGE ERROR</span><strong>That image URL could not be loaded</strong>';
    summaryImage.textContent = '🚘';
    summaryImage.classList.remove('has-image');
  };
  img.src = url;
}

descriptionInput.addEventListener('input', () => {
  document.getElementById('charCount').textContent = descriptionInput.value.length;
});
priceInput.addEventListener('input', () => {
  document.getElementById('pricePreview').textContent = priceInput.value ? money(priceInput.value) : 'Enter your asking price';
});
imageInput.addEventListener('input', updateImagePreview);

form.querySelectorAll('input, select, textarea').forEach(input => {
  input.addEventListener('input', updateSummary);
  input.addEventListener('change', updateSummary);
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!form.reportValidity()) return;

  try {
    setBusy(true);
    show('');

    const user = await getCurrentUser();
    if (!user) {
      show('Please sign in on the marketplace first.');
      setBusy(false);
      return;
    }

    await ensureProfile(user);
    const data = Object.fromEntries(new FormData(form).entries());

    const { error } = await supabase.from('listings').insert({
      seller_id: user.id,
      name: data.name.trim(),
      year: Number(data.year),
      type: data.type,
      fuel: data.fuel,
      price: Number(data.price),
      mileage: Number(data.mileage),
      location: data.location.trim(),
      description: data.description.trim(),
      image_url: data.image_url?.trim() || '',
      transmission: data.transmission,
      seller_name: data.seller_name.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      status: 'pending'
    });

    if (error) throw error;

    show('Listing submitted. It is now pending admin approval.', true);
    form.reset();
    document.getElementById('charCount').textContent = '0';
    document.getElementById('pricePreview').textContent = 'Enter your asking price';
    updateImagePreview();
    updateSummary();

    setTimeout(() => location.href = 'index.html#explore', 1800);
  } catch (error) {
    show(error.message || 'Could not submit listing.');
    setBusy(false);
  }
});

updateSummary();
updateImagePreview();
