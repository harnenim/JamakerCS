namespace Jamaker
{
    partial class WebForm
    {
        /// <summary>
        ///  Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        ///  Clean up any resources being used.
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
        ///  Required method for Designer support - do not modify
        ///  the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            mainView = new Microsoft.Web.WebView2.WinForms.WebView2();
            ((System.ComponentModel.ISupportInitialize)mainView).BeginInit();
            this.layerForDrag = new Jamaker.TransparentPanel();
            SuspendLayout();
            // 
            // layerForDrag
            // 
            this.layerForDrag.AllowDrop = true;
            this.layerForDrag.BackColor = System.Drawing.SystemColors.ActiveCaption;
            this.layerForDrag.Dock = System.Windows.Forms.DockStyle.Fill;
            this.layerForDrag.Location = new System.Drawing.Point(0, 0);
            this.layerForDrag.Name = "layerForDrag";
            this.layerForDrag.Size = new System.Drawing.Size(800, 450);
            this.layerForDrag.TabIndex = 7;
            this.layerForDrag.Visible = false;
            this.layerForDrag.DragDrop += new System.Windows.Forms.DragEventHandler(this.DragDropMain);
            this.layerForDrag.DragOver += new System.Windows.Forms.DragEventHandler(this.DragOverMain);
            this.layerForDrag.DragLeave += new System.EventHandler(this.DragLeaveMain);
            this.layerForDrag.MouseClick += new System.Windows.Forms.MouseEventHandler(this.ClickLayerForDrag);
            // 
            // mainView
            // 
            this.mainView.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom)
            | System.Windows.Forms.AnchorStyles.Left)
            | System.Windows.Forms.AnchorStyles.Right)));
            this.mainView.Location = new System.Drawing.Point(0, 0);
            this.mainView.Margin = new System.Windows.Forms.Padding(0);
            mainView.Name = "mainView";
            mainView.Size = new Size(800, 450);
            mainView.TabIndex = 0;
            mainView.ZoomFactor = 1D;
            // 
            // MainForm
            // 
            AutoScaleDimensions = new SizeF(7F, 15F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(800, 450);
            this.Controls.Add(this.layerForDrag);
            Controls.Add(mainView);
            Name = "WebForm";
            ((System.ComponentModel.ISupportInitialize)mainView).EndInit();
            ResumeLayout(false);
        }

        #endregion

        protected Microsoft.Web.WebView2.WinForms.WebView2 mainView;
        protected TransparentPanel layerForDrag;
    }
}