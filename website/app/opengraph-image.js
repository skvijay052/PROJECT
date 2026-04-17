import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          padding: 56,
          background:
            'radial-gradient(circle at top left, rgba(255,255,255,0.14), transparent 35%), radial-gradient(circle at right center, rgba(255,255,255,0.08), transparent 38%), linear-gradient(180deg, #050505 0%, #101010 100%)',
          color: '#f5f5f5',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 56,
            right: 86,
            width: 320,
            height: 320,
            borderRadius: 40,
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(255,255,255,0.04)',
            boxShadow: '0 28px 90px rgba(0,0,0,0.45)',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                width: 88,
                height: 88,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 44,
                background: 'rgba(255,255,255,0.96)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#050505',
                fontSize: 38,
              }}
            >
              {'\u2665'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 56, fontWeight: 700 }}>Bandhanaa</div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 20,
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.66)',
                }}
              >
                Where hearts unite
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 720 }}>
            <div
              style={{
                color: 'rgba(255,255,255,0.78)',
                fontSize: 20,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 2,
              }}
            >
              Matrimony website and app
            </div>
            <div style={{ marginTop: 18, fontSize: 76, fontWeight: 700, lineHeight: 0.96 }}>
              Modern matchmaking for meaningful relationships.
            </div>
            <div
              style={{
                marginTop: 22,
                fontSize: 28,
                lineHeight: 1.4,
                color: 'rgba(255,255,255,0.72)',
              }}
            >
              Rich profiles, private chat, Android APK download, and iPhone-ready distribution.
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
