namespace WebViewForm
{
    partial class Alert
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(Alert));
            labelMsg = new Label();
            buttonSubmit = new Button();
            panel1 = new Panel();
            panel1.SuspendLayout();
            SuspendLayout();
            // 
            // labelMsg
            // 
            labelMsg.Dock = DockStyle.Top;
            labelMsg.Location = new Point(0, 0);
            labelMsg.Name = "labelMsg";
            labelMsg.Padding = new Padding(10, 0, 10, 0);
            labelMsg.Size = new Size(224, 48);
            labelMsg.TabIndex = 0;
            labelMsg.Text = "메시지";
            labelMsg.TextAlign = ContentAlignment.MiddleCenter;
            // 
            // buttonSubmit
            // 
            buttonSubmit.Dock = DockStyle.Right;
            buttonSubmit.Location = new Point(135, 10);
            buttonSubmit.Margin = new Padding(3, 4, 3, 10);
            buttonSubmit.Name = "buttonSubmit";
            buttonSubmit.Size = new Size(73, 21);
            buttonSubmit.TabIndex = 2;
            buttonSubmit.Text = "확인";
            buttonSubmit.UseVisualStyleBackColor = true;
            buttonSubmit.Click += OK;
            // 
            // panel1
            // 
            panel1.BackColor = SystemColors.Menu;
            panel1.Controls.Add(buttonSubmit);
            panel1.Dock = DockStyle.Bottom;
            panel1.Location = new Point(0, 51);
            panel1.Name = "panel1";
            panel1.Padding = new Padding(0, 10, 16, 11);
            panel1.Size = new Size(224, 42);
            panel1.TabIndex = 3;
            // 
            // Alert
            // 
            AutoScaleDimensions = new SizeF(7F, 15F);
            AutoScaleMode = AutoScaleMode.Font;
            BackColor = SystemColors.Window;
            ClientSize = new Size(224, 93);
            Controls.Add(panel1);
            Controls.Add(labelMsg);
            FormBorderStyle = FormBorderStyle.FixedDialog;
            Icon = (Icon)resources.GetObject("$this.Icon");
            Margin = new Padding(3, 4, 3, 4);
            MaximizeBox = false;
            MinimizeBox = false;
            Name = "Alert";
            SizeGripStyle = SizeGripStyle.Hide;
            Text = "Alert";
            TopMost = true;
            panel1.ResumeLayout(false);
            ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.Label labelMsg;
        private System.Windows.Forms.Button buttonSubmit;
        private Panel panel1;
    }
}