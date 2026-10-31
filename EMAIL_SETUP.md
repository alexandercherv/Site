# Application form delivery

The application form retains its existing Formspree action, `https://formspree.io/f/mwpgvwdk`, and the public contact address `schoolsmartgarden@gmail.com`. No delivery account, recipient, hosting or DNS configuration is changed by the frontend language work.

`script.js` validates the required name, email, course and package/trial selection, then sends the form with `Accept: application/json`. Successful HTTP responses display a translated confirmation and clear the form. Failures and the 20-second request timeout display an error, retain entered values, and offer an explicit email link. Opening that link requires a visitor action; the site does not launch an email client automatically or claim that an unsent application was delivered.

The unused EmailJS script and placeholder initialization have been removed. EmailJS is not required for this integration.

Use the [mocked local browser tests](tests/README.md) for frontend verification. They intercept every Formspree request and never send applications or email. Real delivery, recipient verification, service limits and spam protection must be checked separately in the existing Formspree account by its owner before an explicitly authorized live delivery test.
