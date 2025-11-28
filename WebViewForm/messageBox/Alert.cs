namespace WebViewForm
{
    public partial class Alert : Form
    {
        public Alert(Form form, string msg, string title)
        {
            InitializeComponent();

            StartPosition = FormStartPosition.Manual;
            Location = new Point(
                form.Location.X + (form.Width  / 2) - (Width  / 2)
            ,   form.Location.Y + (form.Height / 2) - (Height / 2)
            );

            labelMsg.Text = msg;

            Text = title;
        }

        private void OnClick(object sender, EventArgs e)
        {
            Close();
        }

        private void OnKeyDown(object sender, KeyEventArgs e)
        {
            switch (e.KeyCode)
            {
                case Keys.Space:
                case Keys.Escape:
                    Close();
                    break;
            }
        }
    }
}
