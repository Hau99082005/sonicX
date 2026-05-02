interface Options {
  title: string;
  message: string;
  link: string;
  logo: string;
  banner: string;
  btnTitle: string;
}

export const generateTemplate = (options: Options) => {
  const { title, message, link, logo, banner, btnTitle } = options;
  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { margin: 0; padding: 0; background-color: #ffffff; -webkit-text-size-adjust: none; text-size-adjust: none; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; }
    #MessageViewBody a { color: inherit; text-decoration: none; }
    p { line-height: inherit; }
    @media (max-width: 670px) {
      .email-wrapper { width: 100% !important; }
      .content-cell { padding-left: 24px !important; padding-right: 24px !important; }
      .btn-link { display: block !important; }
    }
  </style>
</head>
<body style="background-color: #ffffff; margin: 0; padding: 0;">

  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
    style="background-color: #ffffff; padding: 40px 16px;">
    <tr>
      <td align="center">

        <table class="email-wrapper" border="0" cellpadding="0" cellspacing="0" role="presentation"
          style="width: 600px; max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 32px rgba(0,0,0,0.4);">

          <tr>
            <td style="background-color: #ffffff; padding: 24px 40px; border-bottom: 3px solid #1d4ed8;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <img src="${logo}" alt="SonicX" style="display: block; height: 100px; width: auto; max-width: 280px;">
                  </td>
                  <td align="right">
                    <span style="color: #1d4ed8; font-family: 'Inter', Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">Music Platform</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 0;">
              <img src="${banner}" alt="${title}"
                style="display: block; width: 100%; height: auto;">
            </td>
          </tr>

          <tr>
            <td class="content-cell" style="padding: 48px 40px 40px; background-color: #ffffff;">

              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding-bottom: 8px;">
                    <span style="display: inline-block; background-color: #eff6ff; color: #1d4ed8; font-family: 'Inter', Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 12px; border-radius: 4px;">Thông báo</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 20px;">
                    <h1 style="color: #0f172a; font-family: 'Inter', Arial, sans-serif; font-size: 26px; font-weight: 700; line-height: 1.3; letter-spacing: -0.5px;">${title}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 36px;">
                    <p style="color: #475569; font-family: 'Inter', Arial, sans-serif; font-size: 15px; line-height: 1.7;">${message}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 36px;">
                    <a href="${link}" target="_blank" class="btn-link"
                      style="display: inline-block; background-color: #1d4ed8; color: #ffffff; font-family: 'Inter', Arial, sans-serif; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 36px; border-radius: 8px; letter-spacing: 0.3px;">
                      ${btnTitle}
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
};
