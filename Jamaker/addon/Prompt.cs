using System;
using System.Drawing;
using System.Windows.Forms;

namespace Jamaker.addon
{
    public partial class Prompt : Form
    {
        public Prompt(int hwnd, string msg, string title)
        {
            InitializeComponent();

            RECT offset = new RECT();
            WinAPI.GetWindowRect(hwnd, ref offset);

            StartPosition = FormStartPosition.Manual;
            Location = new Point((offset.left + offset.right) / 2 - (Width / 2), (offset.top + offset.bottom) / 2 - (Height / 2));

            labelMsg.Text = msg;

            Text = title;
        }

        public string value;

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
