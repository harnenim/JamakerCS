namespace WebViewForm
{
    public partial class Prompt : Form
    {
        public Prompt(Form form, string msg, string title, string def)
        {
            InitializeComponent();

            StartPosition = FormStartPosition.Manual;
            Location = new Point(
                form.Location.X + (form.Width / 2) - (Width / 2)
            ,   form.Location.Y + (form.Height) / 2 - (Height / 2)
            );

            labelMsg.Text = msg;
            textBoxValue.Text = def;

            Text = title;
        }

        public string? value;

        private void EnterValue(object sender, KeyEventArgs e)
        {
            switch (e.KeyCode)
            {
                case Keys.Enter:
                    DialogResult = DialogResult.OK;
                    SubmitValue();
                    break;
                case Keys.Escape:
                    DialogResult = DialogResult.Cancel;
                    SubmitValue();
                    break;
            }
        }

        private void SubmitValue(object sender, EventArgs e)
        {
            DialogResult = DialogResult.OK;
            SubmitValue();
        }

        private void SubmitValue()
        {
            value = textBoxValue.Text;
            Close();
        }
    }
}
