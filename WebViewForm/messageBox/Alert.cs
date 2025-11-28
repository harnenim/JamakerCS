namespace WebViewForm
{
    public partial class Alert : Form
    {
        public Alert(Form form, string msg, string title)
        {
            InitializeComponent();

            StartPosition = FormStartPosition.Manual;
            Location = new Point(
                form.Location.X + (form.Width / 2) - (Width / 2)
            ,   form.Location.Y + (form.Height) / 2 - (Height / 2)
            );

            labelMsg.Text = msg;

            Text = title;
        }

        private void OK(object sender, EventArgs e)
        {
            Close();
        }
    }
}
