namespace WebViewForm
{
    partial class Prompt
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
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(Prompt));
            labelMsg = new Label();
            textBoxValue = new TextBox();
            buttonSubmit = new Button();
            SuspendLayout();
            // 
            // labelMsg
            // 
            labelMsg.AutoSize = true;
            labelMsg.Location = new Point(12, 11);
            labelMsg.Name = "labelMsg";
            labelMsg.Size = new Size(43, 15);
            labelMsg.TabIndex = 0;
            labelMsg.Text = "메시지";
            // 
            // textBoxValue
            // 
            textBoxValue.Anchor = AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
            textBoxValue.Location = new Point(12, 35);
            textBoxValue.Margin = new Padding(3, 4, 3, 4);
            textBoxValue.Name = "textBoxValue";
            textBoxValue.Size = new Size(199, 23);
            textBoxValue.TabIndex = 1;
            textBoxValue.KeyDown += EnterValue;
            // 
            // buttonSubmit
            // 
            buttonSubmit.Anchor = AnchorStyles.Bottom | AnchorStyles.Right;
            buttonSubmit.Location = new Point(217, 32);
            buttonSubmit.Margin = new Padding(3, 4, 3, 4);
            buttonSubmit.Name = "buttonSubmit";
            buttonSubmit.Size = new Size(75, 29);
            buttonSubmit.TabIndex = 2;
            buttonSubmit.Text = "입력";
            buttonSubmit.UseVisualStyleBackColor = true;
            buttonSubmit.Click += SubmitValue;
            // 
            // Prompt
            // 
            AutoScaleDimensions = new SizeF(7F, 15F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(304, 76);
            Controls.Add(buttonSubmit);
            Controls.Add(textBoxValue);
            Controls.Add(labelMsg);
            FormBorderStyle = FormBorderStyle.FixedDialog;
            Icon = (Icon)resources.GetObject("$this.Icon");
            Margin = new Padding(3, 4, 3, 4);
            MaximizeBox = false;
            MinimizeBox = false;
            Name = "Prompt";
            SizeGripStyle = SizeGripStyle.Hide;
            Text = "Prompt";
            TopMost = true;
            ResumeLayout(false);
            PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Label labelMsg;
        private System.Windows.Forms.TextBox textBoxValue;
        private System.Windows.Forms.Button buttonSubmit;
    }
}