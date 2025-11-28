namespace WebViewForm
{
    partial class Confirm
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
            labelMsg = new Label();
            btnNo = new Button();
            panelBtn = new Panel();
            btnYes = new Button();
            panelBtn.SuspendLayout();
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
            // panelBtn
            // 
            panelBtn.BackColor = SystemColors.Menu;
            panelBtn.Controls.Add(btnYes);
            panelBtn.Controls.Add(btnNo);
            panelBtn.Dock = DockStyle.Bottom;
            panelBtn.Location = new Point(0, 51);
            panelBtn.Name = "panel1";
            panelBtn.Padding = new Padding(0, 10, 16, 11);
            panelBtn.Size = new Size(224, 42);
            panelBtn.TabIndex = 3;
            // 
            // btnNo
            // 
            btnNo.Anchor = AnchorStyles.None;
            btnNo.Location = new Point(135, 10);
            btnNo.Margin = new Padding(3, 4, 3, 10);
            btnNo.Name = "btnNo";
            btnNo.Size = new Size(73, 21);
            btnNo.TabIndex = 2;
            btnNo.Text = "아니오(&N)";
            btnNo.UseVisualStyleBackColor = true;
            btnNo.Click += OnClick;
            btnNo.KeyDown += OnKeyDown;
            // 
            // btnYes
            // 
            btnYes.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Right;
            btnYes.Location = new Point(56, 10);
            btnYes.Margin = new Padding(3, 4, 3, 10);
            btnYes.Name = "btnYes";
            btnYes.Size = new Size(73, 21);
            btnYes.TabIndex = 3;
            btnYes.Text = "예(&Y)";
            btnYes.UseVisualStyleBackColor = true;
            btnYes.Click += OnClick;
            btnYes.KeyDown += OnKeyDown;
            // 
            // Confirm
            // 
            AutoScaleDimensions = new SizeF(7F, 15F);
            AutoScaleMode = AutoScaleMode.Font;
            BackColor = SystemColors.Window;
            ClientSize = new Size(224, 93);
            Controls.Add(panelBtn);
            Controls.Add(labelMsg);
            FormBorderStyle = FormBorderStyle.FixedDialog;
            Margin = new Padding(3, 4, 3, 4);
            MaximizeBox = false;
            MinimizeBox = false;
            Name = "Confirm";
            SizeGripStyle = SizeGripStyle.Hide;
            Text = "Confirm";
            TopMost = true;
            panelBtn.ResumeLayout(false);
            ResumeLayout(false);

        }

        #endregion

        private Label labelMsg;
        private Panel panelBtn;
        private Button btnYes;
        private Button btnNo;
    }
}