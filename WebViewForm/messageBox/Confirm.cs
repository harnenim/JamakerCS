namespace WebViewForm
{
    public partial class Confirm : Form
    {
        public Confirm(Form form, string msg, string title)
        {
            InitializeComponent();

            StartPosition = FormStartPosition.Manual;
            Location = new Point(
                form.Location.X + (form.Width  / 2) - (Width  / 2)
            ,   form.Location.Y + (form.Height / 2) - (Height / 2)
            );

            labelMsg.Text = msg;

            Text = title;

            ActiveControl = btnYes;
        }

        private void OnClick(object sender, EventArgs e)
        {
            if (sender == btnYes)
            {
                DialogResult = DialogResult.OK;
                Close();
            }
            else if (sender == btnNo)
            {
                DialogResult = DialogResult.Cancel;
                Close();
            }
            Close();
        }

        private void OnKeyDown(object sender, KeyEventArgs e)
        {
            switch (e.KeyCode)
            {
                case Keys.Space:
                    if (sender == btnYes)
                    {
                        DialogResult = DialogResult.OK;
                        Close();
                    }
                    else if (sender == btnNo)
                    {
                        DialogResult = DialogResult.Cancel;
                        Close();
                    }
                    break;
                case Keys.Escape:
                    DialogResult = DialogResult.Cancel;
                    Close();
                    break;
            }
        }
    }
}
