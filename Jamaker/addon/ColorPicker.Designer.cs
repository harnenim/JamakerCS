namespace Jamaker.addon
{
    partial class ColorPicker
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
            this.border = new System.Windows.Forms.Label();
            this.labelColor = new System.Windows.Forms.Label();
            this.SuspendLayout();
            // 
            // border
            // 
            this.border.BackColor = System.Drawing.Color.Black;
            this.border.Location = new System.Drawing.Point(8, 8);
            this.border.Name = "border";
            this.border.Size = new System.Drawing.Size(60, 18);
            this.border.TabIndex = 0;
            // 
            // labelColor
            // 
            this.labelColor.BackColor = System.Drawing.Color.White;
            this.labelColor.Location = new System.Drawing.Point(9, 9);
            this.labelColor.Name = "labelColor";
            this.labelColor.Size = new System.Drawing.Size(58, 16);
            this.labelColor.TabIndex = 2;
            this.labelColor.Text = "#FFFFFF";
            this.labelColor.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            // 
            // ColorPicker
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(7F, 12F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.Turquoise;
            this.ClientSize = new System.Drawing.Size(9999, 9999);
            this.Controls.Add(this.labelColor);
            this.Controls.Add(this.border);
            this.Cursor = System.Windows.Forms.Cursors.Cross;
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.None;
            this.Location = new System.Drawing.Point(0, 0);
            this.Name = "ColorPicker";
            this.StartPosition = System.Windows.Forms.FormStartPosition.Manual;
            this.Text = "ColorPicker";
            this.TransparencyKey = System.Drawing.Color.Turquoise;
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.Label border;
        private System.Windows.Forms.Label labelColor;
    }
}