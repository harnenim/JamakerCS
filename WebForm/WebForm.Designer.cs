namespace WebViewForm
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
            layerForDrag = new TransparentPanel();
            SuspendLayout();
            // 
            // layerForDrag
            // 
            layerForDrag.AllowDrop = true;
            layerForDrag.BackColor = SystemColors.ActiveCaption;
            layerForDrag.Dock = DockStyle.Fill;
            layerForDrag.Location = new Point(0, 0);
            layerForDrag.Name = "layerForDrag";
            layerForDrag.Size = new Size(800, 450);
            layerForDrag.TabIndex = 7;
            layerForDrag.Visible = false;
            layerForDrag.DragDrop += new DragEventHandler(DragDropMain);
            layerForDrag.DragOver += new DragEventHandler(DragOverMain);
            layerForDrag.DragLeave += new System.EventHandler(DragLeaveMain);
            layerForDrag.MouseClick += new MouseEventHandler(ClickLayerForDrag);
            // 
            // mainView
            // 
            mainView.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom)
            | System.Windows.Forms.AnchorStyles.Left)
            | System.Windows.Forms.AnchorStyles.Right)));
            mainView.Location = new Point(0, 0);
            mainView.Margin = new Padding(0);
            mainView.Name = "mainView";
            mainView.Size = new Size(800, 450);
            mainView.TabIndex = 0;
            mainView.ZoomFactor = 1D;
            // 
            // MainForm
            // 
            AutoScaleDimensions = new SizeF(14F, 32F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(800, 450);
            Controls.Add(layerForDrag);
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