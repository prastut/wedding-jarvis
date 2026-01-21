import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { guestApi } from '../api/client';
import type { GuestRegistryItem, GuestInfo, RegistrySettings } from '../api/client';
import './Wishlist.css';

// Translations for the wishlist UI
const translations = {
  EN: {
    title: 'Wedding Wishlist',
    greeting: 'Hi',
    guestGreeting: 'Guest',
    subtitle: 'Help us start our new life together',
    claimed: 'Claimed',
    youClaimed: 'You claimed this',
    claimButton: 'Claim This Gift',
    unclaimButton: 'Unclaim',
    buyHere: 'Buy Here',
    noItems: 'No items available at the moment',
    loading: 'Loading wishlist...',
    errorTitle: 'Unable to load wishlist',
    registryClosed: 'The gift registry is currently closed. Please check back later.',
    phoneRequired: 'Please use the link sent to you via WhatsApp to access the wishlist.',
  },
  HI: {
    title: 'शादी की विशलिस्ट',
    greeting: 'नमस्ते',
    guestGreeting: 'अतिथि',
    subtitle: 'हमें अपना नया जीवन शुरू करने में मदद करें',
    claimed: 'बुक हो गया',
    youClaimed: 'आपने यह चुना है',
    claimButton: 'यह उपहार चुनें',
    unclaimButton: 'रद्द करें',
    buyHere: 'यहाँ खरीदें',
    noItems: 'इस समय कोई आइटम उपलब्ध नहीं है',
    loading: 'विशलिस्ट लोड हो रही है...',
    errorTitle: 'विशलिस्ट लोड नहीं हो सकी',
    registryClosed: 'गिफ्ट रजिस्ट्री अभी बंद है। कृपया बाद में पुनः प्रयास करें।',
    phoneRequired: 'विशलिस्ट तक पहुँचने के लिए कृपया व्हाट्सएप पर भेजे गए लिंक का उपयोग करें।',
  },
  PA: {
    title: 'ਵਿਆਹ ਦੀ ਵਿਸ਼ਲਿਸਟ',
    greeting: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ',
    guestGreeting: 'ਮਹਿਮਾਨ',
    subtitle: 'ਸਾਡੀ ਨਵੀਂ ਜ਼ਿੰਦਗੀ ਸ਼ੁਰੂ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰੋ',
    claimed: 'ਬੁੱਕ ਹੋ ਗਿਆ',
    youClaimed: 'ਤੁਸੀਂ ਇਹ ਚੁਣਿਆ ਹੈ',
    claimButton: 'ਇਹ ਤੋਹਫ਼ਾ ਚੁਣੋ',
    unclaimButton: 'ਰੱਦ ਕਰੋ',
    buyHere: 'ਇੱਥੇ ਖਰੀਦੋ',
    noItems: 'ਇਸ ਸਮੇਂ ਕੋਈ ਆਈਟਮ ਉਪਲਬਧ ਨਹੀਂ ਹੈ',
    loading: 'ਵਿਸ਼ਲਿਸਟ ਲੋਡ ਹੋ ਰਹੀ ਹੈ...',
    errorTitle: 'ਵਿਸ਼ਲਿਸਟ ਲੋਡ ਨਹੀਂ ਹੋ ਸਕੀ',
    registryClosed: 'ਗਿਫਟ ਰਜਿਸਟਰੀ ਇਸ ਸਮੇਂ ਬੰਦ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਬਾਅਦ ਵਿੱਚ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
    phoneRequired: 'ਵਿਸ਼ਲਿਸਟ ਤੱਕ ਪਹੁੰਚਣ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਵਟਸਐਪ ਰਾਹੀਂ ਭੇਜੇ ਲਿੰਕ ਦੀ ਵਰਤੋਂ ਕਰੋ।',
  },
};

type Language = 'EN' | 'HI' | 'PA';

function getLocalizedText(
  item: GuestRegistryItem,
  field: 'name' | 'description',
  language: Language
): string | null {
  if (language === 'HI' && item[`${field}_hi`]) {
    return item[`${field}_hi`];
  }
  if (language === 'PA' && item[`${field}_pa`]) {
    return item[`${field}_pa`];
  }
  return item[field];
}

export default function Wishlist() {
  const [searchParams] = useSearchParams();
  const phone = searchParams.get('phone');

  const [items, setItems] = useState<GuestRegistryItem[]>([]);
  const [guest, setGuest] = useState<GuestInfo | null>(null);
  const [settings, setSettings] = useState<RegistrySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingItemId, setClaimingItemId] = useState<string | null>(null);

  const language: Language = guest?.language || 'EN';
  const t = translations[language];

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // First check settings (public endpoint)
      const settingsRes = await guestApi.getSettings();
      setSettings(settingsRes);

      if (!settingsRes.isOpen) {
        setError('registryClosed');
        setLoading(false);
        return;
      }

      if (!phone) {
        setError('phoneRequired');
        setLoading(false);
        return;
      }

      // Fetch items with guest info
      const res = await guestApi.getRegistryItems(phone);
      setItems(res.items);
      setGuest(res.guest);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load wishlist';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [phone]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleClaim(itemId: string) {
    if (!phone || claimingItemId) return;

    setClaimingItemId(itemId);

    // Optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, is_claimed: true, claimed_by_me: true } : item
      )
    );

    try {
      await guestApi.claimItem(phone, itemId);
    } catch (err) {
      // Revert on error
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, is_claimed: false, claimed_by_me: false } : item
        )
      );
      const message = err instanceof Error ? err.message : 'Failed to claim item';
      alert(message);
    } finally {
      setClaimingItemId(null);
    }
  }

  async function handleUnclaim(itemId: string) {
    if (!phone || claimingItemId) return;

    setClaimingItemId(itemId);

    // Optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, is_claimed: false, claimed_by_me: false } : item
      )
    );

    try {
      await guestApi.unclaimItem(phone, itemId);
    } catch (err) {
      // Revert on error
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, is_claimed: true, claimed_by_me: true } : item
        )
      );
      const message = err instanceof Error ? err.message : 'Failed to unclaim item';
      alert(message);
    } finally {
      setClaimingItemId(null);
    }
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return null;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Loading state
  if (loading) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-loading">
          <div className="loading-spinner" />
          <p>{t.loading}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const errorMessage =
      error === 'registryClosed'
        ? t.registryClosed
        : error === 'phoneRequired'
          ? t.phoneRequired
          : error;

    return (
      <div className="wishlist-page">
        <div className="wishlist-error">
          <h2>{t.errorTitle}</h2>
          <p>{errorMessage}</p>
        </div>
      </div>
    );
  }

  const guestName = guest?.name || t.guestGreeting;

  return (
    <div className="wishlist-page">
      <header className="wishlist-header">
        <h1>{t.title}</h1>
        <p className="wishlist-greeting">
          {t.greeting}, {guestName}!
        </p>
        <p className="wishlist-subtitle">{t.subtitle}</p>
      </header>

      <main className="wishlist-content">
        {items.length === 0 ? (
          <div className="wishlist-empty">
            <p>{t.noItems}</p>
          </div>
        ) : (
          <div className="wishlist-grid">
            {items.map((item) => (
              <div
                key={item.id}
                className={`wishlist-card ${item.is_claimed && !item.claimed_by_me ? 'claimed' : ''} ${item.claimed_by_me ? 'my-claim' : ''}`}
              >
                {item.image_url && (
                  <div className="card-image">
                    <img
                      src={item.image_url}
                      alt={getLocalizedText(item, 'name', language) || ''}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="card-content">
                  <h3 className="card-title">{getLocalizedText(item, 'name', language)}</h3>

                  {getLocalizedText(item, 'description', language) && (
                    <p className="card-description">
                      {getLocalizedText(item, 'description', language)}
                    </p>
                  )}

                  {item.show_price && item.price && (
                    <p className="card-price">{formatPrice(item.price)}</p>
                  )}

                  <div className="card-actions">
                    {item.claimed_by_me ? (
                      <>
                        <span className="claim-badge my-claim-badge">{t.youClaimed}</span>
                        <button
                          className="btn-unclaim"
                          onClick={() => handleUnclaim(item.id)}
                          disabled={claimingItemId === item.id}
                        >
                          {claimingItemId === item.id ? '...' : t.unclaimButton}
                        </button>
                      </>
                    ) : item.is_claimed ? (
                      <span className="claim-badge">{t.claimed}</span>
                    ) : (
                      <button
                        className="btn-claim"
                        onClick={() => handleClaim(item.id)}
                        disabled={claimingItemId === item.id}
                      >
                        {claimingItemId === item.id ? '...' : t.claimButton}
                      </button>
                    )}

                    {item.external_link && !item.is_claimed && (
                      <a
                        href={item.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-buy"
                      >
                        {t.buyHere}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {settings?.upiAddress && (
        <section className="upi-section">
          <div className="upi-divider" />
          <h2>
            {language === 'HI'
              ? 'नकद उपहार देना पसंद करते हैं?'
              : language === 'PA'
                ? 'ਨਕਦ ਤੋਹਫ਼ਾ ਦੇਣਾ ਪਸੰਦ ਕਰਦੇ ਹੋ?'
                : 'Prefer to give cash?'}
          </h2>
          <p className="upi-description">
            {language === 'HI'
              ? 'आप नीचे दिए गए UPI पते पर भेज सकते हैं:'
              : language === 'PA'
                ? 'ਤੁਸੀਂ ਹੇਠਾਂ ਦਿੱਤੇ UPI ਪਤੇ ਤੇ ਭੇਜ ਸਕਦੇ ਹੋ:'
                : 'You can send to the UPI address below:'}
          </p>
          <div className="upi-address-box">
            <code className="upi-address">{settings.upiAddress}</code>
            <button
              className="btn-copy"
              onClick={() => {
                navigator.clipboard.writeText(settings.upiAddress!);
                alert(
                  language === 'HI'
                    ? 'UPI पता कॉपी किया गया!'
                    : language === 'PA'
                      ? 'UPI ਪਤਾ ਕਾਪੀ ਕੀਤਾ ਗਿਆ!'
                      : 'UPI address copied!'
                );
              }}
            >
              {language === 'HI' ? 'कॉपी करें' : language === 'PA' ? 'ਕਾਪੀ ਕਰੋ' : 'Copy'}
            </button>
          </div>
        </section>
      )}

      <footer className="wishlist-footer">
        <p>
          {language === 'HI'
            ? 'आपके प्यार और आशीर्वाद के लिए धन्यवाद'
            : language === 'PA'
              ? 'ਤੁਹਾਡੇ ਪਿਆਰ ਅਤੇ ਅਸ਼ੀਰਵਾਦ ਲਈ ਧੰਨਵਾਦ'
              : 'Thank you for your love and blessings'}
        </p>
      </footer>
    </div>
  );
}
